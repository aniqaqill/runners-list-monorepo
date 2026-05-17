# ==============================================================================
# OUTPUTS - Values exported after Terraform applies
# ==============================================================================
# These are useful values you can reference after deployment.
# Run: terraform output
# ==============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "security_group_id" {
  description = "ID of the ECS security group"
  value       = aws_security_group.ecs.id
}

output "ecr_repository_url" {
  description = "URL for pushing Docker images (used by CI/CD)"
  value       = aws_ecr_repository.api.repository_url
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.api.name
}

output "task_definition_family" {
  description = "Family name of the task definition"
  value       = aws_ecs_task_definition.api.family
}

# ==============================================================================
# QUICK COMMANDS
# ==============================================================================
# 
# Get API public IP:
#   TASK=$(aws ecs list-tasks --cluster runners-list-cluster --query 'taskArns[0]' --output text)
#   ENI=$(aws ecs describe-tasks --cluster runners-list-cluster --tasks $TASK --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text)
#   aws ec2 describe-network-interfaces --network-interface-ids $ENI --query 'NetworkInterfaces[0].Association.PublicIp' --output text
#
# Toggle API:
#   terraform apply -var="api_enabled=false"  # OFF
#   terraform apply -var="api_enabled=true"   # ON
# ==============================================================================
