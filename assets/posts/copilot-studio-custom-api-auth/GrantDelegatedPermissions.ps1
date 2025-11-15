#!/usr/bin/env pwsh
# Simplified script to grant delegated permissions to custom API registrations only
# This script grants permissions to the HttpWithAADApp Microsoft 1st party app for custom APIs


param(
    [Parameter(Mandatory=$false)]
    [string]$AppId = "d2ebd3a9-1ada-4480-8b2d-eac162716601", # HttpWithAADApp default
    
    [Parameter(Mandatory=$true)]
    [string]$ResourceAppIdUri, # Custom API URI (e.g., api://f11e5c51-43d0-48d4-8acf-01cb55bbc6f4)
    
    [Parameter(Mandatory=$false)]
    [string[]]$Scopes, # Array of permission scopes (e.g., "API.Invoke")
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("AllPrincipals", "Principal")]
    [string]$ConsentType = "AllPrincipals",
    
    [Parameter(Mandatory=$false)]
    [string]$PrincipalId # Required if ConsentType is "Principal"
)

# Check platform
if ($IsMacOS -or $PSVersionTable.OS -like "*Darwin*") {
    Write-Host "Detected macOS - Using PowerShell Core" -ForegroundColor Green
} elseif ($IsWindows -or $PSVersionTable.PSEdition -eq "Desktop") {
    Write-Host "Detected Windows PowerShell/Core" -ForegroundColor Green
} else {
    Write-Host "Detected Linux - Using PowerShell Core" -ForegroundColor Green
}

Write-Host "========================================="
Write-Host "Custom API Delegated Permissions Grant"
Write-Host "========================================="

# Install and import required modules
try {
    Import-Module Microsoft.Graph.Applications -ErrorAction Stop
    Import-Module Microsoft.Graph.Identity.SignIns -ErrorAction Stop
}
catch {
    Write-Host "Installing Microsoft Graph PowerShell modules..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes on first run..." -ForegroundColor Yellow
    
    if ($PSVersionTable.PSVersion.Major -ge 7) {
        Install-Module Microsoft.Graph -Scope CurrentUser -Force -AllowClobber
    } else {
        Install-Module Microsoft.Graph -Scope CurrentUser -Force
    }
    
    Import-Module Microsoft.Graph.Applications
    Import-Module Microsoft.Graph.Identity.SignIns
}

# Connect to Microsoft Graph
Write-Host "Connecting to Microsoft Graph..."
Connect-MgGraph -Scopes "User.ReadWrite.All", "Directory.AccessAsUser.All", "Application.Read.All" -NoWelcome

try {
    # Get or create the service principal for the HttpWithAADApp
    Write-Host "Finding service principal for HttpWithAADApp: $AppId"
    $ServicePrincipal = Get-MgServicePrincipal -Filter "appId eq '$AppId'"
    
    if (-not $ServicePrincipal) {
        Write-Host "Creating service principal for HttpWithAADApp: $AppId"
        $ServicePrincipal = New-MgServicePrincipal -AppId $AppId
    }
    
    # Prompt for ResourceAppIdUri if not provided
    if (-not $ResourceAppIdUri) {
        $ResourceAppIdUri = Read-Host "Enter the custom API URI (e.g., api://f11e5c51-43d0-48d4-8acf-01cb55bbc6f4)"
    }
    
    Write-Host "Looking up custom API registration with URI: $ResourceAppIdUri"
    
    # Extract the App ID from the URI (format: api://guid or api://guid/scope)
    if ($ResourceAppIdUri -match "api://([a-fA-F0-9\-]{36})") {
        $extractedAppId = $matches[1]
        Write-Host "Extracted App ID: $extractedAppId"
        
        # Find the service principal by App ID
        $ResourceServicePrincipal = Get-MgServicePrincipal -Filter "appId eq '$extractedAppId'"
        
        if (-not $ResourceServicePrincipal) {
            Write-Warning "Service principal not found for App ID: $extractedAppId"
            Write-Host "Attempting to find by Application ID URI..."
            
            # Search by identifierUris
            $allServicePrincipals = Get-MgServicePrincipal -All
            $ResourceServicePrincipal = $allServicePrincipals | Where-Object { 
                $_.IdentifierUris -contains $ResourceAppIdUri -or 
                $_.IdentifierUris | Where-Object { $_ -like "*$extractedAppId*" }
            }
            
            if (-not $ResourceServicePrincipal) {
                throw "Custom API service principal not found. Ensure the app registration exists and is properly configured."
            }
        }
    } else {
        throw "Invalid App ID URI format. Expected format: api://guid or api://guid/scope"
    }
    
    Write-Host "Found custom API: $($ResourceServicePrincipal.DisplayName)"
    
    # Handle scopes
    if (-not $Scopes) {
        Write-Host "`nAvailable scopes for $($ResourceServicePrincipal.DisplayName):"
        $availableScopes = $ResourceServicePrincipal.Oauth2PermissionScopes | Sort-Object Value
        
        if ($availableScopes.Count -eq 0) {
            Write-Warning "No OAuth2 permission scopes found for this custom API."
            $customScope = Read-Host "Enter the custom scope name (e.g., 'API.Invoke')"
            if ($customScope) {
                $Scopes = @($customScope)
            } else {
                throw "No scopes provided for custom API"
            }
        } else {
            Write-Host "Available OAuth2 scopes:"
            for ($i = 0; $i -lt $availableScopes.Count; $i++) {
                $scope = $availableScopes[$i]
                Write-Host "$($i + 1). $($scope.Value) - $($scope.UserConsentDisplayName)"
            }
            
            do {
                $scopeInput = Read-Host "`nEnter scope numbers (comma-separated) or 'c' for custom scope"
                if ($scopeInput -eq 'c') {
                    $customScope = Read-Host "Enter custom scope name"
                    $Scopes = @($customScope)
                    break
                } else {
                    $scopeNumbers = $scopeInput -split ',' | ForEach-Object { [int]$_.Trim() }
                    $validSelection = $scopeNumbers | Where-Object { $_ -ge 1 -and $_ -le $availableScopes.Count }
                    if ($validSelection.Count -gt 0) {
                        $Scopes = $scopeNumbers | ForEach-Object { $availableScopes[$_ - 1].Value }
                        break
                    }
                }
            } while ($true)
        }
    }
    
    $joinedScopes = $Scopes -join ' '
    Write-Host "`nSelected scopes: $joinedScopes"
    
    # Handle principal selection for specific user consent
    if ($ConsentType -eq "Principal" -and -not $PrincipalId) {
        Write-Host "`nFetching users for principal selection..."
        $users = Get-MgUser -Top 50 | Select-Object Id, DisplayName, UserPrincipalName
        
        Write-Host "Available users:"
        for ($i = 0; $i -lt $users.Count; $i++) {
            Write-Host "$($i + 1). $($users[$i].DisplayName) ($($users[$i].UserPrincipalName))"
        }
        
        do {
            $userSelection = Read-Host "`nSelect user number (1-$($users.Count))"
            $userIndex = [int]$userSelection - 1
        } while ($userIndex -lt 0 -or $userIndex -ge $users.Count)
        
        $PrincipalId = $users[$userIndex].Id
        Write-Host "Selected user: $($users[$userIndex].DisplayName)"
    }
    
    # Prepare grant parameters
    $grantParams = @{
        clientId = $ServicePrincipal.Id
        consentType = $ConsentType
        resourceId = $ResourceServicePrincipal.Id
        scope = $joinedScopes
    }
    
    if ($ConsentType -eq "Principal") {
        $grantParams.principalId = $PrincipalId
    }
    
    # Check for existing grants
    $filter = "clientId eq '$($ServicePrincipal.Id)' and resourceId eq '$($ResourceServicePrincipal.Id)'"
    if ($ConsentType -eq "Principal") {
        $filter += " and consentType eq 'Principal'"
        $existingGrant = Get-MgOauth2PermissionGrant -Filter $filter | Where-Object { $_.PrincipalId -eq $PrincipalId }
    } else {
        $filter += " and consentType eq 'AllPrincipals'"
        $existingGrant = Get-MgOauth2PermissionGrant -Filter $filter
    }
    
    # Create or update the grant
    if ($existingGrant) {
        Write-Host "`nUpdating existing permission grant..."
        Update-MgOauth2PermissionGrant -OAuth2PermissionGrantId $existingGrant.Id -BodyParameter $grantParams
        Write-Host "Permission grant updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "`nCreating new permission grant..."
        New-MgOauth2PermissionGrant -BodyParameter $grantParams
        Write-Host "Permission grant created successfully!" -ForegroundColor Green
    }
    
    # Display final grant details
    Write-Host "`n" + "="*50
    Write-Host "GRANT DETAILS" -ForegroundColor Cyan
    Write-Host "="*50
    Write-Host "Client (HttpWithAADApp): $($ServicePrincipal.DisplayName)"
    Write-Host "Client ID: $($ServicePrincipal.Id)"
    Write-Host "Resource (Custom API): $($ResourceServicePrincipal.DisplayName)"
    Write-Host "Resource ID: $($ResourceServicePrincipal.Id)"
    Write-Host "Custom API URI: $ResourceAppIdUri"
    Write-Host "Consent Type: $ConsentType"
    if ($ConsentType -eq "Principal") {
        Write-Host "Principal ID: $PrincipalId"
    }
    Write-Host "Granted Scopes: $joinedScopes"
    Write-Host "="*50
}
catch {
    Write-Error "Error: $_"
    Write-Host "`nTroubleshooting tips:" -ForegroundColor Yellow
    Write-Host "1. Ensure the custom app registration exists in your tenant"
    Write-Host "2. Verify the App ID URI is correctly configured in the app registration"
    Write-Host "3. Check that OAuth2 permission scopes are properly defined"
    Write-Host "4. Ensure you have sufficient permissions to read app registrations"
    Write-Host "5. Verify the App ID URI follows the format: api://guid"
}
finally {
    Disconnect-MgGraph
    Write-Host "`nScript completed." -ForegroundColor Green
}