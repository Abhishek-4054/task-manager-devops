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

        stage('Build and Push Backend') {
            steps {
                dir('backend') {
                    bat """
                        docker build -t %BACKEND_IMAGE%:%IMAGE_TAG% .
                        docker tag %BACKEND_IMAGE%:%IMAGE_TAG% %BACKEND_IMAGE%:latest
                        echo %DOCKERHUB_CREDENTIALS_PSW% | docker login -u %DOCKERHUB_CREDENTIALS_USR% --password-stdin
                        docker push %BACKEND_IMAGE%:%IMAGE_TAG%
                        docker push %BACKEND_IMAGE%:latest
                    """
                }
            }
        }

        stage('Build and Push Frontend') {
            steps {
                dir('frontend') {
                    bat """
                        docker build -t %FRONTEND_IMAGE%:%IMAGE_TAG% .
                        docker tag %FRONTEND_IMAGE%:%IMAGE_TAG% %FRONTEND_IMAGE%:latest
                        docker push %FRONTEND_IMAGE%:%IMAGE_TAG%
                        docker push %FRONTEND_IMAGE%:latest
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo '🚀 Applying K8s manifests and updating images...'
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'KEY_FILE')]) {
                    bat """
                        @echo off
                        :: Fix Windows Permissions
                        icacls "%KEY_FILE%" /inheritance:r
                        icacls "%KEY_FILE%" /grant:r *S-1-5-18:(R)
                        icacls "%KEY_FILE%" /grant:r *S-1-5-32-544:(R)
                        
                        :: Copy the k8s folder to the EC2 instance so we can apply the YAMLs
                        echo [+] Copying manifests to EC2...
                        scp -i "%KEY_FILE%" -o StrictHostKeyChecking=no -r k8s/ %EC2_USER%@%EC2_HOST%:~/k8s/

                        echo [+] Applying manifests and updating images...
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