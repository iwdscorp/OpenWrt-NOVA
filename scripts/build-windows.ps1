param([string]$Distribution = 'docker-desktop')
$ErrorActionPreference = 'Stop'
$sourcePath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$destination = Join-Path (Split-Path $sourcePath) 'luci-theme-nova-2.8.1-r1.apk'
$linuxSource = '/mnt/host/' + $sourcePath.Substring(0,1).ToLower() + '/' + $sourcePath.Substring(3).Replace('\','/')
if ($Distribution -ne 'docker-desktop') {
    $linuxSource = '/mnt/' + $sourcePath.Substring(0,1).ToLower() + '/' + $sourcePath.Substring(3).Replace('\','/')
}
$start = [Diagnostics.ProcessStartInfo]::new('wsl.exe')
$start.UseShellExecute = $false
$start.RedirectStandardOutput = $true
$start.RedirectStandardError = $true
foreach ($argument in @('-d',$Distribution,'-u','root','--','sh',"$linuxSource/scripts/build-apk.sh",$linuxSource)) { $start.ArgumentList.Add($argument) }
$process = [Diagnostics.Process]::Start($start)
$errors = $process.StandardError.ReadToEndAsync()
$stream = [IO.File]::Create($destination + '.part')
try { $process.StandardOutput.BaseStream.CopyTo($stream) } finally { $stream.Dispose() }
$process.WaitForExit()
$diagnostics = $errors.GetAwaiter().GetResult()
Write-Host $diagnostics
if ($process.ExitCode -ne 0) { throw "APK build failed ($($process.ExitCode)); retained .part for diagnosis" }
Move-Item -LiteralPath ($destination + '.part') -Destination $destination -Force
Get-FileHash -Algorithm SHA256 -LiteralPath $destination
