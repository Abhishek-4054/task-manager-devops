pipeline {
    agent any
    
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKERHUB_USERNAME = 'abhishekc4054'
        BACKEND_IMAGE = "${DOCKERHUB_USERNAME}/task-manager-backend"
        FRONTEND_IMAGE = "${DOCKERHUB_USERNAME}/task-manager-frontend"
        EC2_HOST = '184.73.7.238'
        EC2_USER = 'ubuntu'
        IMAGE_TAG = "${BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build and Push Images') {
            steps {
                echo '🔨 Building and Pushing Docker Images...'
                bat """
                    cd backend && docker build -t %BACKEND_IMAGE%:%IMAGE_TAG% . && docker tag %BACKEND_IMAGE%:%IMAGE_TAG% %BACKEND_IMAGE%:latest
                    cd ../frontend && docker build -t %FRONTEND_IMAGE%:%IMAGE_TAG% . && docker tag %FRONTEND_IMAGE%:%IMAGE_TAG% %FRONTEND_IMAGE%:latest
                    
                    echo %DOCKERHUB_CREDENTIALS_PSW% | docker login -u %DOCKERHUB_CREDENTIALS_USR% --password-stdin
                    docker push %BACKEND_IMAGE%:%IMAGE_TAG%
                    docker push %BACKEND_IMAGE%:latest
                    docker push %FRONTEND_IMAGE%:%IMAGE_TAG%
                    docker push %FRONTEND_IMAGE%:latest
                """
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo '🚀 Deploying to EC2...'
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'KEY_FILE')]) {
                    bat """
                        @echo off
                        :: 1. Fix Windows Permissions (Confirmed Working)
                        icacls "%KEY_FILE%" /inheritance:r
                        icacls "%KEY_FILE%" /grant:r *S-1-5-18:(R)
                        icacls "%KEY_FILE%" /grant:r *S-1-5-32-544:(R)
                        
                        :: 2. Ensure the k8s directory exists on the EC2
                        echo [+] Preparing remote directory...
                        ssh -i "%KEY_FILE%" -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "mkdir -p ~/k8s"

                        :: 3. Copy files individually to avoid "realpath" directory errors
                        echo [+] Uploading manifests...
                        scp -i "%KEY_FILE%" -o StrictHostKeyChecking=no k8s/*.yaml %EC2_USER%@%EC2_HOST%:~/k8s/

                        :: 4. Apply and Update
                        echo [+] Applying Kubernetes changes...
                        ssh -i "%KEY_FILE%" -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% ^
                        "kubectl apply -f ~/k8s/ && ^
                         kubectl set image deployment/backend-deployment backend=%BACKEND_IMAGE%:%IMAGE_TAG% && ^
                         kubectl set image deployment/frontend-deployment frontend=%FRONTEND_IMAGE%:%IMAGE_TAG% && ^
                         kubectl rollout status deployment/backend-deployment && ^
                         kubectl rollout status deployment/frontend-deployment"
                    """
                }
            }
        }
    }

    post {
        always {
            bat 'docker logout'
        }
    }
}