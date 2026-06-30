# terraform/backend.tf
# Remote state storage - prevents state from being lost locally
# S3 for state file + DynamoDB for locking (prevents concurrent applies)

terraform {
  backend "s3" {
    bucket         = "my-tf-test-bucket-3134"  # Change to unique name (S3 bucket names are globally unique)
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
  }
}

# One-time setup — run this FIRST before any other terraform apply
# After S3 bucket and DynamoDB table exist, terraform backend will use them automatically

# aws s3 mb s3://cisco-terraform-state-YOURUNIQUEID --region ap-south-1
# aws dynamodb create-table \
#   --table-name cisco-terraform-lock \
#   --attribute-definitions AttributeName=LockID,AttributeType=S \
#   --key-schema AttributeName=LockID,KeyType=HASH \
#   --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
#   --region ap-south-1
