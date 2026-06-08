pipeline {
    agent any

    environment {
        GHCR_USERNAME  = credentials('ghcr-username')
        GHCR_TOKEN     = credentials('ghcr-token')
        REGISTRY       = "ghcr.io/kushalpendhare"
        IMAGE_API      = "${REGISTRY}/cisco-api"
        IMAGE_FRONTEND = "${REGISTRY}/cisco-frontend"
        K8S_NAMESPACE  = "ciscotechnologies"
        ANSIBLE_HOST   = "192.168.0.231"
        K8S_MASTER     = "192.168.0.232"
    }

    stages {

        stage('Checkout') {
            steps {
                echo '📥 Pulling latest code...'
                checkout scm
            }
        }

        stage('Login to GHCR') {
            steps {
                echo '🔐 Logging into GitHub Container Registry...'
                sh 'echo $GHCR_TOKEN | docker login ghcr.io -u $GHCR_USERNAME --password-stdin'
            }
        }

        stage('Build API Image') {
            steps {
                echo '🔨 Building Flask API image...'
                sh """
                    docker build -t ${IMAGE_API}:latest \
                                 -t ${IMAGE_API}:${BUILD_NUMBER} \
                                 ./api
                """
            }
        }

        stage('Build Frontend Image') {
            steps {
                echo '🔨 Building React frontend image...'
                sh """
                    docker build -t ${IMAGE_FRONTEND}:latest \
                                 -t ${IMAGE_FRONTEND}:${BUILD_NUMBER} \
                                 ./frontend
                """
            }
        }

        stage('Push Images to GHCR') {
            steps {
                echo '📤 Pushing images to GHCR...'
                sh """
                    docker push ${IMAGE_API}:latest
                    docker push ${IMAGE_API}:${BUILD_NUMBER}
                    docker push ${IMAGE_FRONTEND}:latest
                    docker push ${IMAGE_FRONTEND}:${BUILD_NUMBER}
                """
            }
        }

        stage('Update Image Tags') {
            steps {
                echo '📝 Updating image tags in manifests...'
                sh """
                    sed -i "s|YOUR_REGISTRY/cisco-api:latest|${IMAGE_API}:${BUILD_NUMBER}|g" \
                        k8s/api/deployment.yaml
                    sed -i "s|YOUR_REGISTRY/cisco-frontend:latest|${IMAGE_FRONTEND}:${BUILD_NUMBER}|g" \
                        k8s/frontend/deployment.yaml
                """
            }
        }

        stage('Create K8s Secrets') {
            environment {
                POSTGRES_PASSWORD = credentials('postgres-password')
                FLASK_SECRET_KEY  = credentials('flask-secret-key')
                ADMIN_USERNAME    = credentials('admin-username')
                ADMIN_PASSWORD    = credentials('admin-password')
                TUNNEL_TOKEN      = credentials('tunnel-token')
            }
            steps {
                echo '🔑 Creating K8s secrets from Jenkins credentials...'
                sh """
                    ssh -o StrictHostKeyChecking=no sysadmin@${K8S_MASTER} '
                        kubectl create namespace ${K8S_NAMESPACE} \
                            --dry-run=client -o yaml | kubectl apply -f -

                        kubectl create secret generic cisco-secrets \
                            --namespace=${K8S_NAMESPACE} \
                            --from-literal=POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
                            --from-literal=FLASK_SECRET_KEY="${FLASK_SECRET_KEY}" \
                            --from-literal=ADMIN_USERNAME="${ADMIN_USERNAME}" \
                            --from-literal=ADMIN_PASSWORD="${ADMIN_PASSWORD}" \
                            --from-literal=TUNNEL_TOKEN="${TUNNEL_TOKEN}" \
                            --dry-run=client -o yaml | kubectl apply -f -
                    '
                """
            }
        }

        stage('Create imagePullSecret') {
            steps {
                echo '🔐 Creating GHCR pull secret in K8s...'
                sh """
                    ssh -o StrictHostKeyChecking=no sysadmin@${K8S_MASTER} '
                        kubectl create secret docker-registry ghcr-secret \
                            --namespace=${K8S_NAMESPACE} \
                            --docker-server=ghcr.io \
                            --docker-username=${GHCR_USERNAME} \
                            --docker-password=${GHCR_TOKEN} \
                            --dry-run=client -o yaml | kubectl apply -f -
                    '
                """
            }
        }

        stage('SCP Manifests to Ansible') {
            steps {
                echo '📦 Copying K8s manifests to Ansible server...'
                sh """
                    ssh -o StrictHostKeyChecking=no sysadmin@${ANSIBLE_HOST} \
                        'mkdir -p /tmp/cisco-k8s'
                    scp -o StrictHostKeyChecking=no -r k8s/ \
                        sysadmin@${ANSIBLE_HOST}:/tmp/cisco-k8s/
                    scp -o StrictHostKeyChecking=no ansible/deploy.yml \
                        sysadmin@${ANSIBLE_HOST}:/tmp/cisco-k8s/deploy.yml
                    scp -o StrictHostKeyChecking=no ansible/inventory.ini \
                        sysadmin@${ANSIBLE_HOST}:/tmp/cisco-k8s/inventory.ini
                """
            }
        }

        stage('Deploy via Ansible') {
            steps {
                echo '🚀 Deploying to K8s via Ansible...'
                sh """
                    ssh -o StrictHostKeyChecking=no sysadmin@${ANSIBLE_HOST} \
                    "ansible-playbook /tmp/cisco-k8s/deploy.yml \
                        -i /tmp/cisco-k8s/inventory.ini \
                        --extra-vars 'build_number=${BUILD_NUMBER}'"
                """
            }
        }

        stage('Verify Deployment') {
            steps {
                echo '✅ Verifying pods...'
                sh """
                    ssh -o StrictHostKeyChecking=no sysadmin@${ANSIBLE_HOST} \
                    "ansible -i /tmp/cisco-k8s/inventory.ini all \
                        -m shell -a 'kubectl get pods -n ${K8S_NAMESPACE}'"
                """
            }
        }
    }

    post {
        success {
            echo '🎉 Deployment successful!'
        }
        failure {
            echo '❌ Deployment failed — check logs above'
        }
        always {
            sh 'docker logout ghcr.io'
        }
    }
}