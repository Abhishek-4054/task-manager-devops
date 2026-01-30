pipeline {
    agent any
    
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKERHUB_USERNAME = 'abhishekc4054'
        BACKEND_IMAGE      = "${DOCKERHUB_USERNAME}/task-manager-backend"
        FRONTEND_IMAGE     = "${DOCKERHUB_USERNAME}/task-manager-frontend"
        EC2_HOST           = '184.73.7.238'
        EC2_USER           = 'ubuntu'
        IMAGE_TAG          = "${BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') { steps { checkout scm } }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    bat "docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} ."
                    bat "docker tag ${BACKEND_IMAGE}:${IMAGE_TAG} ${BACKEND_IMAGE}:latest"
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    bat "docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} ."
                    bat "docker tag ${FRONTEND_IMAGE}:${IMAGE_TAG} ${FRONTEND_IMAGE}:latest"
                }
            }
        }

        stage('Push Images') {
            steps {
                bat "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
                bat "docker push ${BACKEND_IMAGE}:${IMAGE_TAG} && docker push ${BACKEND_IMAGE}:latest"
                bat "docker push ${FRONTEND_IMAGE}:${IMAGE_TAG} && docker push ${FRONTEND_IMAGE}:latest"
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo '🚀 Deploying and Troubleshooting Network...'
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'KEY_FILE')]) {
                    bat """
                        @echo off
                        :: 1. Windows Permissions
                        icacls "%KEY_FILE%" /inheritance:r
                        icacls "%KEY_FILE%" /grant:r *S-1-5-18:(R)
                        icacls "%KEY_FILE%" /grant:r *S-1-5-32-544:(R)
                        
                        :: 2. Create directory and upload (using absolute path /home/ubuntu)
                        ssh -i "%KEY_FILE%" -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "mkdir -p /home/ubuntu/k8s"
                        scp -i "%KEY_FILE%" -o StrictHostKeyChecking=no k8s/*.yaml %EC2_USER%@%EC2_HOST%:/home/ubuntu/k8s/

                        :: 3. Refresh and Apply (Flattened command string to avoid bash syntax errors)
                        echo [+] Updating K8s Resources...
                        ssh -i "%KEY_FILE%" -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "kubectl delete svc frontend-service --ignore-not-found && kubectl apply -f /home/ubuntu/k8s/ && kubectl set image deployment/backend-deployment backend=%BACKEND_IMAGE%:%IMAGE_TAG% && kubectl set image deployment/frontend-deployment frontend=%FRONTEND_IMAGE%:%IMAGE_TAG% && kubectl rollout status deployment/frontend-deployment"

                        :: 4. Final Diagnostics (Using 'ss' instead of 'netstat')
                        echo [+] --- NETWORK DIAGNOSTICS ---
                        ssh -i "%KEY_FILE%" -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "echo '[Port Check]' && sudo ss -tulpn | grep 30300 || echo 'PORT 30300 NOT ACTIVE' && echo '[Internal Curl]' && curl -s -I http://localhost:30300 | grep HTTP || echo 'CURL FAILED'"
                    """
                }
            }
        }
    }

    post {
        always { bat 'docker logout' }
    }
}