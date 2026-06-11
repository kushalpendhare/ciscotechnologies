pipeline {
    agent any

    environment {
        GHCR_USERNAME  = credentials('ghcr-username')
        GHCR_TOKEN     = credentials('ghcr-token')
        REGISTRY       = "ghcr.io/kushalpendhare"
        IMAGE_API      = "${REGISTRY}/cisco-api"
        IMAGE_FRONTEND = "${REGISTRY}/cisco-frontend"
        UAT_NAMESPACE  = "ciscotechnologies-uat"
        PROD_NAMESPACE = "ciscotechnologies"
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

        stage('Build Images') {
            parallel {
                stage('Build API') {
                    steps {
                        echo '🔨 Building Flask API...'
                        sh """
                            docker build -t ${IMAGE_API}:${BUILD_NUMBER} \
                                         -t ${IMAGE_API}:uat-latest \
                                         ./api
                        """
                    }
                }
                stage('Build Frontend') {
                    steps {
                        echo '🔨 Building React Frontend...'
                        sh """
                            docker build -t ${IMAGE_FRONTEND}:${BUILD_NUMBER} \
                                         -t ${IMAGE_FRONTEND}:uat-latest \
                                         ./frontend
                        """
                    }
                }
            }
        }

        stage('Security Scan') {
            parallel {
                stage('Scan API Image') {
                    steps {
                        echo '🔍 Scanning API image for CVEs...'
                        sh """
                            docker run --rm \
                                -v /var/run/docker.sock:/var/run/docker.sock \
                                aquasec/trivy image \
                                --exit-code 0 \
                                --severity HIGH,CRITICAL \
                                --no-progress \
                                ${IMAGE_API}:${BUILD_NUMBER} || true
                        """
                    }
                }
                stage('Scan Frontend Image') {
                    steps {
                        echo '🔍 Scanning Frontend image for CVEs...'
                        sh """
                            docker run --rm \
                                -v /var/run/docker.sock:/var/run/docker.sock \
                                aquasec/trivy image \
                                --exit-code 0 \
                                --severity HIGH,CRITICAL \
                                --no-progress \
                                ${IMAGE_FRONTEND}:${BUILD_NUMBER} || true
                        """
                    }
                }
                stage('Python SAST') {
                    steps {
                        echo '🔍 Running Bandit Python SAST...'
                        sh '''
                            pip install bandit -q 2>/dev/null || true
                            bandit -r api/ -ll -ii -f txt || true
                        '''
                    }
                }
                stage('Dependency Check') {
                    steps {
                        echo '🔍 Checking vulnerable dependencies...'
                        sh '''
                            pip install safety -q 2>/dev/null || true
                            safety check -r api/requirements.txt || true
                        '''
                    }
                }
            }
        }

        stage('Push Images') {
            steps {
                echo '📤 Pushing images to GHCR...'
                sh """
                    docker push ${IMAGE_API}:${BUILD_NUMBER}
                    docker push ${IMAGE_API}:uat-latest
                    docker push ${IMAGE_FRONTEND}:${BUILD_NUMBER}
                    docker push ${IMAGE_FRONTEND}:uat-latest
                """
            }
        }

        stage('SCP Manifests to Ansible') {
            steps {
                echo '📝 Updating image tags in manifests...'
                sh """
                    sed -i 's|ghcr.io/kushalpendhare/cisco-frontend:BUILD_NUMBER|ghcr.io/kushalpendhare/cisco-frontend:${BUILD_NUMBER}|g' k8s/frontend/deployment.yaml
                    sed -i 's|ghcr.io/kushalpendhare/cisco-api:BUILD_NUMBER|ghcr.io/kushalpendhare/cisco-api:${BUILD_NUMBER}|g' k8s/api/deployment.yaml
                """

                echo '📦 Copying manifests to Ansible server...'
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

        stage('SCP Manifests to K8s Master') {
            steps {
                echo '📝 Updating image tags in manifests...'
                sh """
                    sed -i 's|ghcr.io/kushalpendhare/cisco-frontend:BUILD_NUMBER|ghcr.io/kushalpendhare/cisco-frontend:${BUILD_NUMBER}|g' k8s/frontend/deployment.yaml
                    sed -i 's|ghcr.io/kushalpendhare/cisco-api:BUILD_NUMBER|ghcr.io/kushalpendhare/cisco-api:${BUILD_NUMBER}|g' k8s/api/deployment.yaml
                """
                echo '📦 Copying manifests to K8s master...'
                sh """
                    ssh -o StrictHostKeyChecking=no sysadmin@${K8S_MASTER} \
                        'mkdir -p /tmp/cisco-k8s'
                    scp -o StrictHostKeyChecking=no -r k8s/ \
                        sysadmin@${K8S_MASTER}:/tmp/cisco-k8s/
                """
            }
        }

        stage('Create UAT Secrets') {
            environment {
                POSTGRES_PASSWORD = credentials('postgres-password')
                FLASK_SECRET_KEY  = credentials('flask-secret-key')
                ADMIN_USERNAME    = credentials('admin-username')
                ADMIN_PASSWORD    = credentials('admin-password')
                TUNNEL_TOKEN      = credentials('tunnel-token')
            }
            steps {
                echo '🔑 Creating UAT secrets...'
                sh """
                    ssh -o StrictHostKeyChecking=no sysadmin@${K8S_MASTER} '
                        kubectl create namespace ${UAT_NAMESPACE} \
                            --dry-run=client -o yaml | kubectl apply -f -

                        kubectl create secret generic cisco-secrets \
                            --namespace=${UAT_NAMESPACE} \
                            --from-literal=POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
                            --from-literal=FLASK_SECRET_KEY="${FLASK_SECRET_KEY}" \
                            --from-literal=ADMIN_USERNAME="${ADMIN_USERNAME}" \
                            --from-literal=ADMIN_PASSWORD="${ADMIN_PASSWORD}" \
                            --from-literal=TUNNEL_TOKEN="${TUNNEL_TOKEN}" \
                            --dry-run=client -o yaml | kubectl apply -f -

                        kubectl create secret docker-registry ghcr-secret \
                            --namespace=${UAT_NAMESPACE} \
                            --docker-server=ghcr.io \
                            --docker-username=${GHCR_USERNAME} \
                            --docker-password=${GHCR_TOKEN} \
                            --dry-run=client -o yaml | kubectl apply -f -
                    '
                """
            }
        }

        stage('Deploy to UAT') {
            steps {
                echo '🚀 Deploying to UAT...'
                sh """
                    ssh -o StrictHostKeyChecking=no sysadmin@${ANSIBLE_HOST} \
                    "ansible-playbook /tmp/cisco-k8s/deploy.yml \
                        -i /tmp/cisco-k8s/inventory.ini \
                        --extra-vars 'target_namespace=${UAT_NAMESPACE}'"
                """
            }
        }

        stage('UAT Smoke Tests') {
            steps {
                echo '🧪 Running smoke tests on UAT...'
                sh """
                    sleep 20

                    echo "Test 1 — API Health..."
                    curl -f --retry 3 --retry-delay 5 \
                        https://uat.ciscotechnologies.com/api/health
                    echo "✅ API OK"

                    echo "Test 2 — Frontend..."
                    curl -f --retry 3 --retry-delay 5 \
                        https://uat.ciscotechnologies.com
                    echo "✅ Frontend OK"

                    echo "Test 3 — Ticket creation..."
                    RESPONSE=\$(curl -sf -X POST \
                        https://uat.ciscotechnologies.com/api/ticket \
                        -H 'Content-Type: application/json' \
                        -d '{"requester":"AutoTest","email":"test@cisco.com","phone":"000","severity":"Low","category":"Other","description":"Automated smoke test"}')
                    echo \$RESPONSE | grep -q "ticket_id"
                    echo "✅ Ticket creation OK"

                    echo "🎉 All UAT tests passed — promoting to PROD"
                """
            }
        }

        stage('Create PROD Secrets') {
            environment {
                POSTGRES_PASSWORD = credentials('postgres-password')
                FLASK_SECRET_KEY  = credentials('flask-secret-key')
                ADMIN_USERNAME    = credentials('admin-username')
                ADMIN_PASSWORD    = credentials('admin-password')
                TUNNEL_TOKEN      = credentials('tunnel-token')
            }
            steps {
                echo '🔑 Updating PROD secrets...'
                sh """
                    ssh -o StrictHostKeyChecking=no sysadmin@${K8S_MASTER} '
                        kubectl create secret generic cisco-secrets \
                            --namespace=${PROD_NAMESPACE} \
                            --from-literal=POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
                            --from-literal=FLASK_SECRET_KEY="${FLASK_SECRET_KEY}" \
                            --from-literal=ADMIN_USERNAME="${ADMIN_USERNAME}" \
                            --from-literal=ADMIN_PASSWORD="${ADMIN_PASSWORD}" \
                            --from-literal=TUNNEL_TOKEN="${TUNNEL_TOKEN}" \
                            --dry-run=client -o yaml | kubectl apply -f -

                        kubectl create secret docker-registry ghcr-secret \
                            --namespace=${PROD_NAMESPACE} \
                            --docker-server=ghcr.io \
                            --docker-username=${GHCR_USERNAME} \
                            --docker-password=${GHCR_TOKEN} \
                            --dry-run=client -o yaml | kubectl apply -f -
                    '
                """
            }
        }

        stage('Deploy to PROD') {
            steps {
                echo '🚀 Deploying to PROD...'
                sh """
                    ssh -o StrictHostKeyChecking=no sysadmin@${ANSIBLE_HOST} \
                    "ansible-playbook /tmp/cisco-k8s/deploy.yml \
                        -i /tmp/cisco-k8s/inventory.ini \
                        --extra-vars 'target_namespace=${PROD_NAMESPACE}'"
                """
            }
        }

        stage('Verify PROD') {
            steps {
                echo '✅ Verifying PROD pods...'
                sh """
                    ssh -o StrictHostKeyChecking=no sysadmin@${K8S_MASTER} \
                    'kubectl get pods -n ${PROD_NAMESPACE}'
                """
            }
        }
    }

    post {
        success {
            echo '🎉 UAT and PROD both deployed successfully!'
        }
        failure {
            echo '❌ Pipeline failed — check logs above'
        }
        always {
            sh 'docker logout ghcr.io'
        }
    }
}