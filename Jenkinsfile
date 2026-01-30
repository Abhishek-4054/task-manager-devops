pipeline {
    agent any
    
    environment {
        // Credentials IDs from Jenkins Global Credentials
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        
        // Configuration
        DOCKERHUB_USERNAME = 'abhishekc4054'
        BACKEND_IMAGE      = "${DOCKERHUB_USERNAME}/task-manager-backend"
        FRONTEND_IMAGE     = "${DOCKERHUB_USERNAME}/task-manager-frontend"
        EC2_HOST           = '184.73.7.238'
        EC2_USER           = 'ubuntu'
        IMAGE_TAG          = "${BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout Code') {
            steps {
                echo '📥 Pulling latest code from SCM...'
                checkout scm
            }
        }

        stage('Build Backend Image') {
            steps {
                echo '🔨 Building Backend Docker Image...'
                dir('backend') {
                    bat "docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} ."
                    bat "docker tag ${BACKEND_IMAGE}:${IMAGE_TAG} ${BACKEND_IMAGE}:latest"
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                echo '🔨 Building Frontend Docker Image...'
                dir('frontend') {
                    bat "docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} ."
                    bat "docker tag ${FRONTEND_IMAGE}:${IMAGE_TAG} ${FRONTEND_IMAGE}:latest"
                }
            }
        }

        stage('Push Backend to DockerHub') {
            steps {
                echo '📤 Pushing Backend Image...'
                bat "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
                bat "docker push ${BACKEND_IMAGE}:${IMAGE_TAG}"
                bat "docker push ${BACKEND_IMAGE}:latest"
            }
        }

        stage('Push Frontend to DockerHub') {
            steps {
                echo '📤 Pushing Frontend Image...'
                bat "docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                bat "docker push ${FRONTEND_IMAGE}:latest"
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo '🚀 Deploying to EC2 and Fixing Network...'
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'KEY_FILE')]) {
                    bat """
                        @echo off
                        :: 1. Secure SSH Key Permissions for Windows
                        icacls "%KEY_FILE%" /inheritance:r
                        icacls "%KEY_FILE%" /grant:r *S-1-5-18:(R)
                        icacls "%KEY_FILE%" /grant:r *S-1-5-32-544:(R)
                        
                        :: 2. Upload Manifests
                        echo [+] Uploading K8s manifests...
                        ssh -i "%KEY_FILE%" -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "mkdir -p ~/k8s"
                        scp -i "%KEY_FILE%" -o StrictHostKeyChecking=no k8s/*.yaml %EC2_USER%@%EC2_HOST%:~/k8s/

                        :: 3. Refresh Service and Update Deployments
                        echo [+] Refreshing Kubernetes resources...
                        ssh -i "%KEY_FILE%" -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% ^
                        "kubectl delete svc frontend-service --ignore-not-found && ^
                         kubectl apply -f ~/k8s/ && ^
                         kubectl set image deployment/backend-deployment backend=%BACKEND_IMAGE%:%IMAGE_TAG% && ^
                         kubectl set image deployment/frontend-deployment frontend=%FRONTEND_IMAGE%:%IMAGE_TAG% && ^
                         kubectl rollout status deployment/backend-deployment && ^
                         kubectl rollout status deployment/frontend-deployment"

                        :: 4. Final Diagnostic Checks
                        echo [+] --- FINAL NETWORK VERIFICATION ---
                        ssh -i "%KEY_FILE%" -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% ^
                        "echo [Port Check] && sudo netstat -tulpn | grep 30300 || echo 'PORT NOT BOUND' && ^
                         echo [Local Curl] && curl -I http://localhost:30300 || echo 'CONNECTION REFUSED'"
                    """
                }
            }
        }
    }

    post {
        always {
            echo '🧹 Logging out of Docker Hub...'
            bat 'docker logout'
        }
        success {
            echo '✅ Deployment Successful!'
            echo "🌐 Frontend: http://${EC2_HOST}:30300"
        }
        failure {
            echo '❌ Deployment Failed. Please check the Diagnostic stage logs.'
        }
    }
}