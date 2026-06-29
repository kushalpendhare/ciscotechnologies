# terraform/modules/rds/main.tf
# RDS PostgreSQL — managed database service
# Replaces your self-hosted postgres pod; automatic backups, snapshots, multi-AZ option

# DB subnet group — tells RDS which subnets to use
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

# Generate random password if not provided
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# RDS Postgres instance
# db.t3.micro qualifies for AWS free tier (if account < 12 months old)
# Otherwise ~$30/month
resource "aws_db_instance" "postgres" {
  identifier     = "${var.project_name}-db"
  engine         = "postgres"
  engine_version = "15.3"
  instance_class = "db.t3.micro"  # Cost-optimized for learning

  # Storage
  allocated_storage = 20  # GB
  storage_type      = "gp3"  # General purpose SSD

  # Credentials
  db_name  = "ciscotech"
  username = var.db_username
  password = var.db_password != "" ? var.db_password : random_password.db_password.result

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.rds_security_group_id]
  publicly_accessible    = false  # Only accessible from ECS tasks

  # Backup and maintenance
  backup_retention_period = 7       # Keep 7 days of backups
  backup_window           = "03:00-04:00"  # 3am UTC
  maintenance_window      = "mon:04:00-mon:05:00"
  skip_final_snapshot     = false   # Create final snapshot on destroy (safety)
  final_snapshot_identifier = "${var.project_name}-db-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql"]
  monitoring_interval              = 60  # CloudWatch monitoring every 60 seconds
  monitoring_role_arn              = aws_iam_role.rds_monitoring.arn

  # Multi-AZ for HA (optional, adds cost)
  multi_az = false  # Disabled for cost savings; enable for production

  tags = {
    Name = "${var.project_name}-postgres"
  }

  depends_on = [aws_iam_role_policy_attachment.rds_monitoring]
}

# IAM role for RDS enhanced monitoring
resource "aws_iam_role" "rds_monitoring" {
  name_prefix = "rds-monitoring-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# DB parameter group — allows tuning Postgres config
resource "aws_db_parameter_group" "postgres" {
  name_prefix = "${var.project_name}-postgres-"
  family      = "postgres15"

  # Example: adjust shared_buffers for 1GB instance
  parameter {
    name  = "shared_buffers"
    value = "262144"  # ~2GB
  }

  tags = {
    Name = "${var.project_name}-postgres-params"
  }
}
