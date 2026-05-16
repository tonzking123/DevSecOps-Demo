# Deliberately bad Terraform — MDC IaC scanner should flag these

provider "azurerm" {
  features {}
}

variable "location" {
  default = "southeastasia"
}

variable "resource_group_name" {
  default = "rg-cnapp-bad"
}

# BAD: Storage account - HTTP allowed, public access, old TLS
resource "azurerm_storage_account" "bad" {
  name                     = "stcnappbadtf"
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  # BAD: allows HTTP
  https_traffic_only_enabled = false
  # BAD: old TLS
  min_tls_version = "TLS1_0"
  # BAD: public blob access
  allow_nested_items_to_be_public = true
  # BAD: shared key
  shared_access_key_enabled = true
}

# BAD: NSG with SSH open to internet
resource "azurerm_network_security_group" "bad" {
  name                = "nsg-bad-open"
  location            = var.location
  resource_group_name = var.resource_group_name

  security_rule {
    name                       = "AllowSSH"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"    # BAD: open to 0.0.0.0/0
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowRDP"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "3389"
    source_address_prefix      = "0.0.0.0/0"  # BAD: explicit wildcard
    destination_address_prefix = "*"
  }
}

# BAD: AKS cluster with no RBAC, no network policy
resource "azurerm_kubernetes_cluster" "bad" {
  name                = "aks-bad-config"
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = "aksbad"

  default_node_pool {
    name       = "default"
    node_count = 1
    vm_size    = "Standard_B2s"
  }

  identity {
    type = "SystemAssigned"
  }

  # BAD: no network policy
  # BAD: no Azure Policy addon
  # BAD: RBAC not explicitly enabled (defaults vary)
}
