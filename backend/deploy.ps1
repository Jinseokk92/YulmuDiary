param(
    [string]$ServiceName = "backend-api",
    [string]$Region = "asia-northeast3",
    [string]$RepositoryPath = "asia-northeast3-docker.pkg.dev/project-e40f8456-38b6-457a-97a/docker-repo/backend-api",
    [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"

function Assert-Command {
    param([Parameter(Mandatory = $true)][string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Command '$Name' was not found. Check installation/login state."
    }
}

function Invoke-External {
    param(
        [Parameter(Mandatory = $true)][string]$Step,
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $false)][string[]]$Arguments = @()
    )

    Write-Host ""
    Write-Host "==> $Step"
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Step '$Step' failed. (exit code: $LASTEXITCODE)"
    }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$image = "$RepositoryPath`:$Tag"

Assert-Command -Name "docker"
Assert-Command -Name "gcloud"

if (Test-Path ".\gradlew.bat") {
    $gradleWrapper = ".\gradlew.bat"
}
elseif (Test-Path ".\gradlew") {
    $gradleWrapper = ".\gradlew"
}
else {
    throw "gradlew (or gradlew.bat) was not found."
}

Write-Host "Deploy image: $image"
Write-Host "Cloud Run service: $ServiceName (region: $Region)"

Invoke-External -Step "1/4 Gradle clean bootJar" -FilePath $gradleWrapper -Arguments @("clean", "bootJar")
Invoke-External -Step "2/4 Docker build" -FilePath "docker" -Arguments @("build", "-t", $image, ".")
Invoke-External -Step "3/4 Docker push" -FilePath "docker" -Arguments @("push", $image)
Invoke-External -Step "4/4 Cloud Run deploy" -FilePath "gcloud" -Arguments @("run", "deploy", $ServiceName, "--image", $image, "--region", $Region)

Write-Host ""
Write-Host "Done: backend deployment completed."
