# ==============================================================================
# NETWORKING - VPC, Subnets, Internet Gateway, Security Group
# ==============================================================================
# This file creates the network infrastructure for your API:
#
# ┌─────────────────────────────────────────────────────────────┐
# │                         VPC                                  │
# │  ┌──────────────────┐  ┌──────────────────┐                 │
# │  │    Subnet 1a     │  │    Subnet 1b     │                 │
# │  │  (10.0.0.0/24)   │  │  (10.0.1.0/24)   │                 │
# │  └────────┬─────────┘  └────────┬─────────┘                 │
# │           │                     │                            │
# │           └──────────┬──────────┘                            │
# │                      │                                       │
# │           ┌──────────▼──────────┐                            │
# │           │   Security Group    │◄── Firewall (port 8080)   │
# │           └──────────┬──────────┘                            │
# └──────────────────────┼───────────────────────────────────────┘
#                        │
#             ┌──────────▼──────────┐
#             │  Internet Gateway   │◄── Door to the internet
#             └─────────────────────┘
# ==============================================================================

# ------------------------------------------------------------------------------
# VPC - Your private network in AWS
# ------------------------------------------------------------------------------
# Think of this as your own gated community in the cloud.
# All your resources live inside this network.

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr # 10.0.0.0/16 = 65,536 IP addresses
  enable_dns_hostnames = true         # Allow DNS names for instances
  enable_dns_support   = true         # Enable DNS resolution

  tags = {
    Name = "${var.project_name}-vpc"
  }

  # IMPORTANT: Don't let Terraform modify this existing resource
  lifecycle {
    ignore_changes = all
  }
}

# ------------------------------------------------------------------------------
# INTERNET GATEWAY - The door to the internet
# ------------------------------------------------------------------------------
# Without this, nothing in your VPC can reach the internet.

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }

  lifecycle {
    ignore_changes = all
  }
}

# ------------------------------------------------------------------------------
# SUBNETS - Subdivisions of your VPC
# ------------------------------------------------------------------------------
# We create 2 subnets in different availability zones for redundancy.
# If one data center has issues, the other can take over.

resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index) # 10.0.0.0/24, 10.0.1.0/24
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true # Containers get public IPs automatically

  tags = {
    Name = "${var.project_name}-public-${count.index + 1}"
  }

  lifecycle {
    ignore_changes = all
  }
}

# ------------------------------------------------------------------------------
# ROUTE TABLE - Traffic rules (where should packets go?)
# ------------------------------------------------------------------------------
# This tells the VPC: "To reach the internet (0.0.0.0/0), use the internet gateway"

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"                  # Any destination
    gateway_id = aws_internet_gateway.main.id # Go through internet gateway
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }

  lifecycle {
    ignore_changes = all
  }
}

# Link subnets to the route table
resource "aws_route_table_association" "public" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id

  lifecycle {
    ignore_changes = all
  }
}

# ------------------------------------------------------------------------------
# SECURITY GROUP - Firewall rules for your containers
# ------------------------------------------------------------------------------
# Controls what traffic can enter and exit your containers.

resource "aws_security_group" "ecs" {
  name        = "${var.project_name}-sg"
  description = "Allow HTTP traffic to the API"
  vpc_id      = aws_vpc.main.id

  # INBOUND: Allow traffic on port 8080 from anywhere
  ingress {
    description = "API HTTP traffic"
    from_port   = var.container_port
    to_port     = var.container_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # From anywhere (public API)
  }

  # OUTBOUND: Allow all traffic out (needed to reach database, etc.)
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"          # All protocols
    cidr_blocks = ["0.0.0.0/0"] # To anywhere
  }

  tags = {
    Name = "${var.project_name}-sg"
  }

  lifecycle {
    ignore_changes = all
  }
}
