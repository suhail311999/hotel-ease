pipeline {
    agent any

    environment {
        IMAGE_NAME     = "hotelease-app"
        IMAGE_TAG      = "latest"
        K8S_DEPLOYMENT = "hotelease-app-deployment"
        K8S_NAMESPACE  = "default"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '5'))
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                echo '📥 Pulling latest code from GitHub...'
                git url: 'https://github.com/suhail311999/hotel-ease.git',
                    branch: 'main'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "🐳 Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG}"
                sh '''
                    eval $(minikube docker-env)
                    docker build -t hotelease-app:latest .
                '''
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo '☸️  Applying Kubernetes manifests...'
                sh 'kubectl apply -f k8s/'

                echo '🔄 Restarting deployment...'
                sh "kubectl rollout restart deployment ${K8S_DEPLOYMENT} -n ${K8S_NAMESPACE}"

                echo '⏳ Waiting for rollout to complete...'
                sh "kubectl rollout status deployment/${K8S_DEPLOYMENT} -n ${K8S_NAMESPACE} --timeout=120s"
            }
        }

        stage('Verify Deployment') {
            steps {
                echo '✅ Verifying pods are running...'
                sh """
                    kubectl get pods -n ${K8S_NAMESPACE} -l app=hotelease-app
                    kubectl get svc  -n ${K8S_NAMESPACE}
                """
            }
        }
    }

    post {
        success {
            echo "🎉 Build #${BUILD_NUMBER} deployed successfully!"
        }
        failure {
            echo "❌ Build #${BUILD_NUMBER} failed. Check the logs above."
        }
        always {
            echo '🧹 Cleaning up dangling Docker images...'
            sh '''
                eval $(minikube docker-env)
                docker image prune -f || true
            '''
        }
    }
}
