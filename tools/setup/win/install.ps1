$rubyPackageName = "RubyInstallerTeam.Ruby.3.2";
$rubyPath = (get-location).Drive.Name + ":\Ruby32-x64\bin"

Write-Host "Checking for Microsoft.WinGet.Client module..."
$wingetInstalled = Get-Module -Name Microsoft.WinGet.Client -ListAvailable | Select-Object -First 1 -ErrorAction Stop

if (-not $wingetInstalled) {
    Write-Host "Microsoft.WinGet.Client module not found. Installing..."
    Install-Module -Name Microsoft.WinGet.Client -Force -Repository PSGallery -Scope CurrentUser -ErrorAction Stop
}

Import-Module Microsoft.WinGet.Client -ErrorAction Stop
Write-Host "Microsoft.WinGet.Client module imported."

$rubyInstalled = Get-WinGetPackage -Query $rubyPackageName | Select-Object -First 1

if (-not $rubyInstalled) {
    Write-Host "Installing Ruby using WinGet..."
    Install-WinGetPackage -Id $rubyPackageName -Mode Silent -ErrorAction Stop | Out-Null

    # Add the Ruby installation path and add to process PATH for gem and bundle commands
    $env:Path = $env:Path + ";$rubyPath"
    Write-Host "Ruby installed."
} else {
    Write-Host "Validated Ruby installation."
}

$bundlerInstalled = gem list bundler -i

if (-not $bundlerInstalled) {
    Write-Host "Installing Bundler gem..."
    gem install bundler
    Write-Host "Bundler gem installed."
} else {
    Write-Host "Validated Bundler gem installation."
}

Write-Host "Running bundle install..."
bundle install --quiet
Write-Host "Bundle install completed."