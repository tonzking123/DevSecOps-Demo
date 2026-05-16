// Deliberately bad Bicep — every resource has misconfigurations
// MDC IaC scanner should flag ALL of these

param location string = resourceGroup().location

// BAD: Storage account with no encryption, public blob access, HTTP allowed
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'stcnappbadstorage'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    // BAD: allows HTTP (should require HTTPS)
    supportsHttpsTrafficOnly: false
    // BAD: public blob access enabled
    allowBlobPublicAccess: true
    // BAD: no minimum TLS version set
    minimumTlsVersion: 'TLS1_0'
    // BAD: shared key access (should use Entra ID)
    allowSharedKeyAccess: true
  }
}

// BAD: NSG with 0.0.0.0/0 open on SSH (port 22) and RDP (port 3389)
resource nsg 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: 'nsg-bad-open'
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowSSHFromAnywhere'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '22'
          // BAD: open to the entire internet
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'AllowRDPFromAnywhere'
        properties: {
          priority: 110
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '3389'
          // BAD: open to the entire internet
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'AllowAllOutbound'
        properties: {
          priority: 200
          direction: 'Outbound'
          access: 'Allow'
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
        }
      }
    ]
  }
}

// BAD: SQL Server with no auditing, public access, weak admin
resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: 'sql-cnapp-bad'
  location: location
  properties: {
    administratorLogin: 'adminuser'
    // BAD: weak password in IaC (should use Key Vault reference)
    administratorLoginPassword: 'P@ssw0rd123!'
    // BAD: public network access enabled
    publicNetworkAccess: 'Enabled'
    // BAD: no minimum TLS
    minimalTlsVersion: '1.0'
  }
}
