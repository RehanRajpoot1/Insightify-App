pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Deploy to DEV') {
            when { branch 'develop' }
            steps {
                sh '''
                    echo "Deploying DEV environment (port 3000/4000)..."
                    docker compose -f docker-compose.yml -p roster-app down
                    docker compose -f docker-compose.yml -p roster-app up --build -d
                    docker compose -f docker-compose.yml -p roster-app ps
                '''
            }
        }

        stage('Deploy to PROD') {
            when { branch 'main' }
            steps {
                sh '''
                    echo "Deploying PROD environment (port 3001/4001)..."
                    docker compose -f docker-compose.prod.yml -p roster-prod down
                    docker compose -f docker-compose.prod.yml -p roster-prod up --build -d
                    docker compose -f docker-compose.prod.yml -p roster-prod ps
                '''
            }
        }
    }

    post {
        success {
            echo "✅ Deployment finished successfully for branch: ${env.BRANCH_NAME}"
        }
        failure {
            echo "❌ Deployment FAILED for branch: ${env.BRANCH_NAME} — check logs above."
        }
    }
}
