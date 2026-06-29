# terraform/environments/dev/main.tf
# This file ties together all modules for the dev environment

module "networking" {
  source = "../../modules/networking"

  vpc_cidr            = var.vpc_cidr
  project_name        = var.project_name
  container_port      = var.container_port
  enable_nat_gateway  = var.enable_nat_gateway
}

module "ecr" {
  source = "../../modules/ecr"

  project_name = var.project_name
}

module "iam" {
  source = "../../modules/iam"

  project_name = var.project_name
}

module "rds" {
  source = "../../modules/rds"

  project_name            = var.project_name
  private_subnet_ids      = module.networking.private_subnet_ids
  rds_security_group_id   = module.networking.rds_security_group_id
  db_username             = var.db_username
  db_password             = var.db_password
}

module "secrets" {
  source = "../../modules/secrets"

  project_name        = var.project_name
  sf_instance_url     = var.sf_instance_url
  sf_client_id        = var.sf_client_id
  sf_client_secret    = var.sf_client_secret
  sf_username         = var.sf_username
  sf_password_token   = var.sf_password_token
  db_host             = module.rds.db_host
  db_port             = module.rds.db_port
  db_name             = module.rds.db_name
  db_user             = var.db_username
  db_password         = var.db_password
}

module "ecs" {
  source = "../../modules/ecs"

  project_name                     = var.project_name
  aws_region                       = var.aws_region
  vpc_id                           = module.networking.vpc_id
  public_subnet_ids                = module.networking.public_subnet_ids
  private_subnet_ids               = module.networking.private_subnet_ids
  alb_security_group_id            = module.networking.alb_security_group_id
  ecs_tasks_security_group_id      = module.networking.ecs_tasks_security_group_id
  container_port                   = var.container_port
  api_image                        = var.api_image
  frontend_image                   = var.frontend_image
  ecs_task_execution_role_arn      = module.iam.ecs_task_execution_role_arn
  ecs_task_role_arn                = module.iam.ecs_task_role_arn
  salesforce_secret_arn            = module.secrets.salesforce_secret_arn
  database_secret_arn              = module.secrets.database_secret_arn
}
