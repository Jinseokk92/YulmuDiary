# ============================================================
# 율무일기 백엔드 배포 스크립트
# 사용법: deploy.ps1
# ============================================================

# ── UTF-8 인코딩 설정 (한글 깨짐 방지) ─────────────────────
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$env:PYTHONIOENCODING = "utf-8"
chcp 65001 > $null

$IMAGE_NAME    = "backend-api"
$REGISTRY      = "asia-northeast3-docker.pkg.dev/project-e40f8456-38b6-457a-97a/docker-repo"
$FULL_IMAGE    = "$REGISTRY/$IMAGE_NAME`:latest"
$SERVICE_NAME  = "backend-api"
$REGION        = "asia-northeast3"
$PROJECT_ID    = "project-e40f8456-38b6-457a-97a"

function Log($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Ok($msg)  { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Err($msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

function Run($desc, $cmd) {
    Log $desc
    Invoke-Expression $cmd
    if ($LASTEXITCODE -ne 0) {
        Err "$desc 실패 (exit $LASTEXITCODE)"
        exit 1
    }
    Ok "$desc 완료"
}

# ── 0. backend 디렉토리로 이동 ──────────────────────────────
Set-Location "$PSScriptRoot\backend"

# ── 1. Gradle 빌드 ─────────────────────────────────────────
Run "Gradle 빌드 (clean bootJar)" "gradle clean bootJar"

# ── 2. Docker 이미지 빌드 ──────────────────────────────────
Run "Docker 이미지 빌드" "docker build -t $IMAGE_NAME`:latest ."

# ── 3. 이미지 태그 ─────────────────────────────────────────
Run "이미지 태그" "docker tag $IMAGE_NAME`:latest $FULL_IMAGE"

# ── 4. Artifact Registry 푸시 ──────────────────────────────
Run "Artifact Registry 푸시" "docker push $FULL_IMAGE"

# ── 5. Cloud Run 배포 ──────────────────────────────────────
Run "Cloud Run 배포" "gcloud run deploy $SERVICE_NAME --image $FULL_IMAGE --region $REGION --project $PROJECT_ID"

# ── 완료 ───────────────────────────────────────────────────
Write-Host ""
Ok "배포가 완료되었습니다."
Set-Location $PSScriptRoot
