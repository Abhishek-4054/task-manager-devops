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
        stage('Checkout') {
            steps { checkout scm }
        }

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

        stage('Push to DockerHub') {
            steps {
                bat "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
                bat "docker push ${BACKEND_IMAGE}:${IMAGE_TAG} && docker push ${BACKEND_IMAGE}:latest"
                bat "docker push ${FRONTEND_IMAGE}:${IMAGE_TAG} && docker push ${FRONTEND_IMAGE}:latest"
            }
        }

        stage('Deploy & Fix Network') {
            steps {
                echo '🚀 Deploying and resetting network binding...'
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'KEY_FILE')]) {
                    bat """
                        @echo off
                        :: Fix Windows SSH Key Permissions
                        icacls "%KEY_FILE%" /inheritance:r
                        icacls "%KEY_FILE%" /grant:r *S-1-5-18:(R)
                        icacls "%KEY_FILE%" /grant:r *S-1-5-32-544:(R)
                        
                        :: Ensure Directory & Upload Manifests
                        ssh -i "%KEY_FILE%" -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "mkdir -p /home/ubuntu/k8s"
                        scp -i "%KEY_FILE%" -o StrictHostKeyChecking=no k8s/*.yaml %EC2_USER%@%EC2_HOST%:/home/ubuntu/k8s/

                        :: Reset Service & Update Image (One long string to avoid bash syntax errors)
                        ssh -i "%KEY_FILE%" -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "kubectl delete svc frontend-service --ignore-not-found && sleep 3 && kubectl apply -f /home/ubuntu/k8s/ && kubectl set image deployment/frontend-deployment frontend=%FRONTEND_IMAGE%:%IMAGE_TAG% && kubectl rollout status deployment/frontend-deployment"

                        :: Final Diagnostic: Test on Private IP (NodePort standard)
                        echo [+] --- FINAL NETWORK VERIFICATION ---
                        ssh -i "%KEY_FILE%" -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "echo '[Service Details]' && kubectl get svc frontend-service && echo '[Internal IP Test]' && curl -s -I http://\$(hostname -I | awk '{print \$1}'):30300 | grep HTTP || echo 'CONNECTION REFUSED'"
                    """
                }
            }
        }
    }

    post {
        always {
            bat 'docker logout'
        }
        success {
            echo "✅ App is live: http://${EC2_HOST}:30300"
        }
    }
}