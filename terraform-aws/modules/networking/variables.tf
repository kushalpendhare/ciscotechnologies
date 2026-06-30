# terraform/modules/networking/variables.tf
variable "vpc_cidr" {
  type = string
}

variable "project_name" {
  type = string
}

variable "enable_nat_gateway" {
  type = bool
}
