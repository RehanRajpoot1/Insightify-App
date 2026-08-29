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

        // ---------------- DEV ----------------
        stage('Build Images - DEV') {
            when { branch 'develop' }
            steps {
                sh 'docker compose -f docker-compose.yml -p roster-app build'
            }
        }

        stage('Security Scan - DEV') {
            when { branch 'develop' }
            steps {
                sh '''
                    echo "===== Trivy scan: backend (DEV) ====="
                    trivy image --severity HIGH,CRITICAL --exit-code 0 --format table roster-app-backend:latest || true

                    echo "===== Trivy scan: frontend (DEV) ====="
                    trivy image --severity HIGH,CRITICAL --exit-code 0 --format table roster-app-frontend:latest || true
                '''
            }
        }

        stage('Code Quality Scan - DEV') {
            when { branch 'develop' }
            steps {
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    sh '''
                        echo "===== SonarQube code quality scan (DEV) ====="
                        docker run --rm \
                          -v "$PWD:/usr/src" \
                          -w /usr/src \
                          sonarsource/sonar-scanner-cli \
                          -Dsonar.host.url=http://192.168.2.60:9000 \
                          -Dsonar.token=$SONAR_TOKEN || true
                    '''
                }
            }
        }

        stage('Deploy to DEV') {
            when { branch 'develop' }
            steps {
                sh '''
                    echo "Deploying DEV environment (port 3000/4000)..."
                    docker compose -f docker-compose.yml -p roster-app down
                    docker compose -f docker-compose.yml -p roster-app up -d
                    docker compose -f docker-compose.yml -p roster-app ps
                '''
            }
        }

        // ---------------- PROD ----------------
        stage('Build Images - PROD') {
            when { branch 'main' }
            steps {
                sh 'docker compose -f docker-compose.prod.yml -p roster-prod build'
            }
        }

        stage('Security Scan - PROD') {
            when { branch 'main' }
            steps {
                sh '''
                    echo "===== Trivy scan: backend (PROD) ====="
                    trivy image --severity HIGH,CRITICAL --exit-code 0 --format table roster-prod-backend_prod:latest || true

                    echo "===== Trivy scan: frontend (PROD) ====="
                    trivy image --severity HIGH,CRITICAL --exit-code 0 --format table roster-prod-frontend_prod:latest || true
                '''
            }
        }

        stage('Deploy to PROD') {
            when { branch 'main' }
            steps {
                sh '''
                    echo "Deploying PROD environment (port 3001/4001)..."
                    docker compose -f docker-compose.prod.yml -p roster-prod down
                    docker compose -f docker-compose.prod.yml -p roster-prod up -d
                    docker compose -f docker-compose.prod.yml -p roster-prod ps
                '''
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline finished successfully for branch: ${env.BRANCH_NAME}"
        }
        failure {
            echo "❌ Pipeline FAILED for branch: ${env.BRANCH_NAME} — check logs above."
        }
    }
}
