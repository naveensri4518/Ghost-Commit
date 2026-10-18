import os
import re
import time
import json
import base64
import logging
from typing import List, Optional, Dict, Any

import httpx
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("commitghost")

# Load environment variables
load_dotenv()

PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "127.0.0.1")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", None)

app = FastAPI(
    title="CommitGhost API",
    description="Analyze public GitHub repos and surface 3 actionable business opportunities grounded in code.",
    version="1.0.0",
)

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Schemas
# ---------------------------------------------------------

class AnalyzeRequest(BaseModel):
    repo_url: str = Field(..., description="Public GitHub repository URL or owner/repo format")

class Opportunity(BaseModel):
    product_name: str
    problem_solved: str
    target_customer: str
    proposed_solution: str
    how_existing_code_helps: str
    pricing_hypothesis: str
    mvp_implementation_plan: List[str]
    difficulty: int = Field(..., ge=1, le=5)

class RepoOverview(BaseModel):
    name: str
    description: Optional[str] = ""
    summary: str
    key_technologies: List[str]
    primary_languages: List[str]
    stars: int = 0
    forks: int = 0
    default_branch: str = "main"
    repo_url: str = ""

class AnalyzeResponse(BaseModel):
    repo_overview: RepoOverview
    opportunities: List[Opportunity]

class HealthResponse(BaseModel):
    status: str
    ollama_connected: bool
    ollama_model: str
    model_available: bool
    github_auth: bool

# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------

def parse_github_repo(url_or_slug: str) -> tuple[str, str]:
    """Extract owner and repo name from various GitHub URL formats."""
    cleaned = url_or_slug.strip()
    cleaned = re.sub(r"^https?://(www\.)?github\.com/", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"^github\.com/", "", cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.split("?")[0].split("#")[0]
    cleaned = re.sub(r"\.git$", "", cleaned, flags=re.IGNORECASE).strip("/")

    parts = cleaned.split("/")
    if len(parts) != 2 or not parts[0] or not parts[1]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid GitHub repository format. Please provide 'owner/repo' or 'https://github.com/owner/repo'."
        )
    owner, repo = parts[0], parts[1]
    if not re.match(r"^[a-zA-Z0-9_\-\.]+$", owner) or not re.match(r"^[a-zA-Z0-9_\-\.]+$", repo):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Repository name contains invalid characters."
        )
    return owner, repo

def get_github_headers() -> Dict[str, str]:
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "CommitGhost-App/1.0"
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return headers

def clean_readme_text(raw_text: str) -> str:
    """Extract clean, meaningful paragraphs from README, stripping badges and HTML noise."""
    lines = raw_text.splitlines()
    clean_lines = []
    for line in lines:
        stripped = line.strip()
        # Skip badge links, images, empty dividers
        if stripped.startswith("[![") or stripped.startswith("<img") or stripped.startswith("<p align="):
            continue
        if stripped.startswith("[!") or stripped.startswith("[badge"):
            continue
        if stripped:
            clean_lines.append(stripped)
        if len("\n".join(clean_lines)) >= 600:
            break
    cleaned = "\n".join(clean_lines)[:600]
    return cleaned or raw_text[:500]

async def fetch_github_data(owner: str, repo: str) -> Dict[str, Any]:
    """Fetch repo metadata, languages, readme, and select key files safely."""
    headers = get_github_headers()
    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        # 1. Fetch Repository Metadata
        meta_url = f"https://api.github.com/repos/{owner}/{repo}"
        meta_resp = await client.get(meta_url, headers=headers)
        
        if meta_resp.status_code == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"GitHub repository '{owner}/{repo}' not found or is private. Please verify the URL."
            )
        elif meta_resp.status_code == 403:
            msg = "GitHub API rate limit exceeded. Please retry in a few minutes or set a GITHUB_TOKEN in backend/.env."
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=msg)
        elif meta_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"GitHub API error ({meta_resp.status_code}): {meta_resp.text[:200]}"
            )

        meta = meta_resp.json()
        default_branch = meta.get("default_branch", "main")

        # 2. Fetch Languages
        lang_url = f"https://api.github.com/repos/{owner}/{repo}/languages"
        lang_resp = await client.get(lang_url, headers=headers)
        languages_dict = lang_resp.json() if lang_resp.status_code == 200 else {}
        primary_languages = list(languages_dict.keys())[:5]

        # 3. Fetch README
        readme_url = f"https://api.github.com/repos/{owner}/{repo}/readme"
        readme_resp = await client.get(readme_url, headers=headers)
        readme_content = ""
        if readme_resp.status_code == 200:
            try:
                raw_b64 = readme_resp.json().get("content", "")
                decoded = base64.b64decode(raw_b64).decode("utf-8", errors="replace")
                readme_content = clean_readme_text(decoded)
            except Exception as e:
                logger.warning(f"Failed to decode README: {e}")

        # 4. Fetch File Tree
        tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1"
        tree_resp = await client.get(tree_url, headers=headers)
        file_paths = []
        if tree_resp.status_code == 200:
            tree_data = tree_resp.json().get("tree", [])
            for item in tree_data:
                if item.get("type") == "blob":
                    path = item.get("path", "")
                    if not any(ignored in path for ignored in [
                        "node_modules/", ".git/", "dist/", "build/", "__pycache__/", 
                        ".venv/", ".vscode/", ".idea/", "package-lock.json", "yarn.lock"
                    ]):
                        file_paths.append(path)

        # 5. Pick up to 2 informative manifest or entrypoint files
        priority_files = [
            "package.json", "requirements.txt", "pyproject.toml", "Cargo.toml",
            "go.mod", "pom.xml", "main.py", "app.py", "index.js", "src/index.ts"
        ]
        
        selected_files = []
        for pf in priority_files:
            if pf in file_paths:
                selected_files.append(pf)
            if len(selected_files) >= 2:
                break

        inspected_snippets = {}
        for file_path in selected_files:
            raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{default_branch}/{file_path}"
            try:
                file_resp = await client.get(raw_url, headers=headers, timeout=8.0)
                if file_resp.status_code == 200:
                    text_content = file_resp.text
                    # Compact representation for JSON package files
                    if file_path == "package.json":
                        try:
                            pkg = json.loads(text_content)
                            deps = list(pkg.get("dependencies", {}).keys())[:8]
                            dev_deps = list(pkg.get("devDependencies", {}).keys())[:5]
                            compact_str = f"Name: {pkg.get('name')}, Deps: {', '.join(deps)}, DevDeps: {', '.join(dev_deps)}"
                            inspected_snippets[file_path] = compact_str
                            continue
                        except:
                            pass
                    
                    lines = text_content.splitlines()[:30]
                    content_snippet = "\n".join(lines)[:600]
                    inspected_snippets[file_path] = content_snippet
            except Exception as e:
                logger.warning(f"Could not fetch file {file_path}: {e}")

        return {
            "meta": meta,
            "owner": owner,
            "repo": repo,
            "default_branch": default_branch,
            "primary_languages": primary_languages,
            "readme_excerpt": readme_content,
            "file_count": len(file_paths),
            "sample_files": file_paths[:15],
            "inspected_snippets": inspected_snippets,
        }

# In-memory cache to avoid repeated AI calls for previously analyzed repositories
ANALYSIS_CACHE: Dict[str, Any] = {}

async def query_ollama(prompt: str, system_prompt: str) -> str:
    """Query local Ollama instance with qwen2.5:3b using JSON output format."""
    generate_url = f"{OLLAMA_BASE_URL}/api/generate"
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "system": system_prompt,
        "format": "json",
        "stream": False,
        "options": {
            "temperature": 0.2,
            "num_ctx": 1536,
            "num_predict": 750,
            "top_p": 0.9
        }
    }

    start_time = time.time()
    logger.info(f"[TIMING] Dispatching prompt ({len(prompt)} chars) to Ollama {OLLAMA_MODEL}...")
    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            resp = await client.post(generate_url, json=payload)
            elapsed = time.time() - start_time
            logger.info(f"[TIMING] Ollama inference finished in {elapsed:.1f}s, HTTP: {resp.status_code}")
            
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Ollama inference error ({resp.status_code}): {resp.text[:200]}"
                )
            result = resp.json()
            raw_response = result.get("response", "").strip()
            return raw_response
    except httpx.ConnectError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Cannot reach Ollama at {OLLAMA_BASE_URL}. Ensure Ollama is running ('ollama serve' or desktop app)."
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Ollama inference timed out after 180 seconds. The local machine might be under heavy load."
        )

def sanitize_json_response(raw_text: str) -> Dict[str, Any]:
    """Attempt to parse JSON, stripping markdown code fences and handling partial closures."""
    text = raw_text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    text = text.strip()

    try:
        return json.loads(text)
    except Exception:
        pass

    # Attempt to heal unclosed brackets/braces
    fixed = text
    # If ends with trailing comma, strip it
    fixed = re.sub(r",\s*$", "", fixed)
    open_curlies = fixed.count("{") - fixed.count("}")
    open_squares = fixed.count("[") - fixed.count("]")
    if open_squares > 0:
        fixed += "]" * open_squares
    if open_curlies > 0:
        fixed += "}" * open_curlies

    try:
        return json.loads(fixed)
    except Exception:
        # Regex search for top-level json block
        match = re.search(r"(\{[^{}]*\"opportunities\"[^{}]*:[^{}]*\[.*\].*\})", text, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        # Re-raise standard JSONDecodeError so caller can invoke repair prompt
        return json.loads(text)

async def repair_json_with_ollama(malformed_text: str) -> Dict[str, Any]:
    """One-shot retry to repair malformed JSON from qwen2.5:3b."""
    repair_prompt = (
        "Convert this text to strictly valid JSON matching this schema:\n"
        '{"repo_overview":{"name":"","description":"","summary":"","key_technologies":[],"primary_languages":[]},'
        '"opportunities":[{"product_name":"","problem_solved":"","target_customer":"","proposed_solution":"",'
        '"how_existing_code_helps":"","pricing_hypothesis":"(unvalidated hypothesis)","mvp_implementation_plan":[],"difficulty":3}]}\n\n'
        f"Input:\n{malformed_text[:1000]}"
    )
    repaired_raw = await query_ollama(
        prompt=repair_prompt,
        system_prompt="Output ONLY valid raw JSON without explanation or markdown."
    )
    return sanitize_json_response(repaired_raw)

# ---------------------------------------------------------
# Routes
# ---------------------------------------------------------

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Verify backend status, Ollama availability, and model readiness."""
    ollama_ok = False
    model_found = False
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                ollama_ok = True
                models_data = resp.json().get("models", [])
                model_names = [m.get("name", "").split(":")[0] for m in models_data]
                full_names = [m.get("name", "") for m in models_data]
                target_base = OLLAMA_MODEL.split(":")[0]
                if target_base in model_names or OLLAMA_MODEL in full_names:
                    model_found = True
    except Exception as e:
        logger.warning(f"Ollama health check failed: {e}")

    return HealthResponse(
        status="healthy" if ollama_ok else "degraded",
        ollama_connected=ollama_ok,
        ollama_model=OLLAMA_MODEL,
        model_available=model_found,
        github_auth=bool(GITHUB_TOKEN)
    )

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_repository(request: AnalyzeRequest):
    """Analyze a public GitHub repo and discover 3 grounded business opportunities."""
    t_start = time.time()
    owner, repo = parse_github_repo(request.repo_url)
    cache_key = f"{owner.lower()}/{repo.lower()}"

    # Return cached analysis if this repository was already processed
    if cache_key in ANALYSIS_CACHE:
        logger.info(f"[CACHE HIT] Returning existing grounded analysis for {cache_key} (0.00s)")
        return ANALYSIS_CACHE[cache_key]

    t_gh = time.time()
    repo_data = await fetch_github_data(owner, repo)
    logger.info(f"[TIMING] GitHub metadata & tree fetched in {time.time() - t_gh:.2f}s")

    meta = repo_data["meta"]
    description = meta.get("description") or "No description provided."
    stars = meta.get("stargazers_count", 0)
    forks = meta.get("forks_count", 0)
    default_branch = repo_data["default_branch"]
    primary_languages = repo_data["primary_languages"]
    
    snippets_text = ""
    for path, code in repo_data["inspected_snippets"].items():
        snippets_text += f"\n[{path}]: {code}"

    system_prompt = (
        "You are CommitGhost, a pragmatic startup advisor and software architect. "
        "Analyze this GitHub repository code and surface 3 realistic, monetizable product opportunities grounded in its actual code and architecture. "
        "Always output strictly valid JSON matching the schema."
    )

    user_prompt = f"""Repository: {owner}/{repo}
Description: {description}
Stars: {stars} | Languages: {", ".join(primary_languages)}
Sample Files: {", ".join(repo_data["sample_files"][:8])}
README: {repo_data["readme_excerpt"][:400] or "None"}
Key Snippets: {snippets_text or "None"}

Output a JSON object with this exact structure (keep each field to 1 clear sentence):
{{
  "repo_overview": {{
    "name": "{owner}/{repo}",
    "description": "{description[:180]}",
    "summary": "1 concise sentence explaining the repository's core functionality.",
    "key_technologies": ["List 3-5 detected technologies"],
    "primary_languages": ["{", ".join(primary_languages[:3])}"]
  }},
  "opportunities": [
    {{
      "product_name": "Product Name",
      "problem_solved": "1 sentence: core customer pain point",
      "target_customer": "1 sentence: target customer persona",
      "proposed_solution": "1 sentence: the commercial offering",
      "how_existing_code_helps": "1 sentence: how existing repository code provides a head start",
      "pricing_hypothesis": "$X/mo (Unvalidated hypothesis based on market comps)",
      "mvp_implementation_plan": [
        "Step 1: Containerize core service",
        "Step 2: Add API authentication",
        "Step 3: Build customer interface",
        "Step 4: Launch and validate"
      ],
      "difficulty": 2
    }}
  ]
}}
Provide exactly 3 distinct items in opportunities. Keep sentences concise so the JSON is complete.
"""

    raw_response = await query_ollama(user_prompt, system_prompt)
    
    # Try parsing
    parsed_json = None
    try:
        parsed_json = sanitize_json_response(raw_response)
    except Exception as e:
        logger.warning(f"Initial JSON parse failed: {e}. Attempting repair prompt.")
        try:
            parsed_json = await repair_json_with_ollama(raw_response)
        except Exception as repair_e:
            logger.error(f"Repair prompt failed: {repair_e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"AI model produced invalid JSON format. Please try again. Raw: {raw_response[:200]}"
            )

    # Validate and normalize parsed JSON
    try:
        overview_data = parsed_json.get("repo_overview", {})
        repo_overview = RepoOverview(
            name=f"{owner}/{repo}",
            description=overview_data.get("description") or description,
            summary=overview_data.get("summary") or f"Analysis of {owner}/{repo}.",
            key_technologies=overview_data.get("key_technologies") or primary_languages or ["Codebase"],
            primary_languages=primary_languages,
            stars=stars,
            forks=forks,
            default_branch=default_branch,
            repo_url=f"https://github.com/{owner}/{repo}"
        )

        raw_opportunities = parsed_json.get("opportunities", [])
        if not isinstance(raw_opportunities, list) or len(raw_opportunities) == 0:
            raise ValueError("No opportunities array returned in model output.")

        opportunities: List[Opportunity] = []
        for item in raw_opportunities[:3]:
            pricing = str(item.get("pricing_hypothesis", "Subscription / Tiered"))
            if "unvalidated" not in pricing.lower():
                pricing = f"{pricing} (Unvalidated pricing hypothesis)"
            
            diff = item.get("difficulty", 3)
            try:
                diff = max(1, min(5, int(diff)))
            except:
                diff = 3

            plan = item.get("mvp_implementation_plan", [])
            if not isinstance(plan, list) or not plan:
                plan = [
                    "Wrap the existing codebase into a clean containerized service",
                    "Add customer authentication and API key tracking",
                    "Build a focused dashboard for target users",
                    "Deploy to cloud with analytics and feedback loop"
                ]

            opp = Opportunity(
                product_name=str(item.get("product_name", "Turnkey Solution")),
                problem_solved=str(item.get("problem_solved", "Manual and inefficient workflows")),
                target_customer=str(item.get("target_customer", "Software developers and technical teams")),
                proposed_solution=str(item.get("proposed_solution", "A hosted and maintained solution based on this code.")),
                how_existing_code_helps=str(item.get("how_existing_code_helps", "Leverages existing core architecture.")),
                pricing_hypothesis=pricing,
                mvp_implementation_plan=[str(step) for step in plan],
                difficulty=diff
            )
            opportunities.append(opp)

        total_time = time.time() - t_start
        logger.info(f"[TIMING] Total analysis pipeline for {owner}/{repo} completed in {total_time:.2f}s")

        response_payload = AnalyzeResponse(
            repo_overview=repo_overview,
            opportunities=opportunities
        )
        ANALYSIS_CACHE[cache_key] = response_payload
        return response_payload
    except Exception as validation_err:
        logger.error(f"Validation error on parsed JSON: {validation_err}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Model response did not meet schema requirements: {str(validation_err)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
