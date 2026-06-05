pipeline {
    agent any

    environment {
        GHCR_USERNAME = credentials('ghcr-username')
        GHCR_TOKEN    = credentials('ghcr-token')
        REGISTRY      = "ghcr.io/${GHCR_USERNAME}"
        IMAGE_API      = "${REGISTRY}/cisco-api"
        IMAGE_FRONTEND = "${REGISTRY}/cisco-frontend"
        K8S_NAMESPACE  = "ciscotechnologies"
        ANSIBLE_HOST   = "192.168.0.231"
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
                sh '''
                    echo $GHCR_TOKEN | docker login ghcr.io \
                        -u $GHCR_USERNAME --password-stdin
                '''
            }
        }

        stage('Build API Image') {
            steps {
                echo '🔨 Building Flask API image...'
                sh '''
                    docker build -t $IMAGE_API:latest \
                                 -t $IMAGE_API:${BUILD_NUMBER} \
                                 ./api
                '''
            }
        }

        stage('Build Frontend Image') {
            steps {
                echo '🔨 Building React frontend image...'
                sh '''
                    docker build -t $IMAGE_FRONTEND:latest \
                                 -t $IMAGE_FRONTEND:${BUILD_NUMBER} \
                                 ./frontend
                '''
            }
        }

        stage('Push Images to GHCR') {
            steps {
                echo '📤 Pushing images to GitHub Container Registry...'
                sh '''
                    docker push $IMAGE_API:latest
                    docker push $IMAGE_API:${BUILD_NUMBER}
                    docker push $IMAGE_FRONTEND:latest
                    docker push $IMAGE_FRONTEND:${BUILD_NUMBER}
                '''
            }
        }

        stage('Update K8s Manifests') {
            steps {
                echo '📝 Updating image tags in K8s manifests...'
                sh '''
                    sed -i "s|YOUR_REGISTRY/cisco-api:latest|$IMAGE_API:${BUILD_NUMBER}|g" \
                        k8s/api/deployment.yaml
                    sed -i "s|YOUR_REGISTRY/cisco-frontend:latest|$IMAGE_FRONTEND:${BUILD_NUMBER}|g" \
                        k8s/frontend/deployment.yaml
                '''
            }
        }

        stage('Deploy via Ansible') {
            steps {
                echo '🚀 Triggering Ansible deployment to K8s...'
                sh '''
                    ansible-playbook -i $ANSIBLE_HOST, \
                        ansible/deploy.yml \
                        --extra-vars "build_number=${BUILD_NUMBER}"
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                echo '✅ Verifying pods are running...'
                sh '''
                    ansible -i $ANSIBLE_HOST, all \
                        -m shell \
                        -a "kubectl get pods -n ciscotechnologies"
                '''
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