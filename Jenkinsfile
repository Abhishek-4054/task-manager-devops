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

        stage('Build Backend Image') {
            steps {
                dir('backend') {
                    bat """
                        docker build -t %BACKEND_IMAGE%:%IMAGE_TAG% .
                        docker tag %BACKEND_IMAGE%:%IMAGE_TAG% %BACKEND_IMAGE%:latest
                    """
                }
            }
        }

        stage('Build Frontend Image') {
            steps {
                dir('frontend') {
                    bat """
                        docker build -t %FRONTEND_IMAGE%:%IMAGE_TAG% .
                        docker tag %FRONTEND_IMAGE%:%IMAGE_TAG% %FRONTEND_IMAGE%:latest
                    """
                }
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                bat """
                    echo %DOCKERHUB_CREDENTIALS_PSW% | docker login -u %DOCKERHUB_CREDENTIALS_USR% --password-stdin
                    docker push %BACKEND_IMAGE%:%IMAGE_TAG%
                    docker push %BACKEND_IMAGE%:latest
                    docker push %FRONTEND_IMAGE%:%IMAGE_TAG%
                    docker push %FRONTEND_IMAGE%:latest
                """
            }
        }

        stage('Deploy to Kubernetes (EC2)') {
            steps {
                echo '🚀 Fixing permissions and deploying...'
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'KEY_FILE')]) {
                    bat """
                        @echo off
                        :: Remove all inherited permissions
                        icacls "%KEY_FILE%" /inheritance:r
                        
                        :: Grant Full control to the System and the current owner
                        :: This bypasses the "Account Name" mapping error
                        icacls "%KEY_FILE%" /grant:r *S-1-5-18:(R)
                        icacls "%KEY_FILE%" /grant:r *S-1-5-32-544:(R)
                        
                        echo [+] Connecting to EC2...
                        ssh -i "%KEY_FILE%" -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% ^
                        "kubectl set image deployment/backend-deployment backend=%BACKEND_IMAGE%:%IMAGE_TAG% && ^
                         kubectl set image deployment/frontend-deployment frontend=%FRONTEND_IMAGE%:%IMAGE_TAG% && ^
                         kubectl rollout status deployment/backend-deployment && ^
                         kubectl rollout status deployment/frontend-deployment && ^
                         kubectl get pods"
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