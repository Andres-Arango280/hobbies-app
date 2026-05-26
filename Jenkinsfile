pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
    }

    environment {
        // Cypress Cloud
        CYPRESS_RECORD_KEY = credentials('cypress-record-key')

        // Docker Hub
        DOCKER_CREDS = credentials('dockerhub-credentials')

        // App
        APP_NAME = 'hobbies-app'
        APP_PORT = '3000'
    }

    stages {

        // ─────────────────────────────────────────────
        // INSTALL DEPENDENCIES
        // ─────────────────────────────────────────────
        stage('Install Dependencies') {
            steps {
                bat 'npm install'
            }
        }

        // ─────────────────────────────────────────────
        // RUN JEST TESTS
        // ─────────────────────────────────────────────
        stage('Run Jest Tests') {
            steps {
                bat 'npm run test'
            }
        }

        // ─────────────────────────────────────────────
        // BUILD DOCKER IMAGE
        // ─────────────────────────────────────────────
        stage('Build Docker Image') {
            steps {
                bat 'docker build -t %APP_NAME% .'
            }
        }

        // ─────────────────────────────────────────────
        // START CONTAINER FOR CYPRESS
        // ─────────────────────────────────────────────
        stage('Start App for Cypress') {
            steps {

                // Elimina contenedor previo si existe
                bat 'docker stop hobbies-test 2>nul || exit 0'
                bat 'docker rm hobbies-test 2>nul || exit 0'

                // Inicia contenedor temporal
                bat 'docker run -d --name hobbies-test -p 3000:3000 hobbies-app'

                // Espera que Express levante
                bat 'ping 127.0.0.1 -n 15 > nul'
            }
        }

        // ─────────────────────────────────────────────
        // CYPRESS CLOUD TESTS
        // ─────────────────────────────────────────────
        stage('Cypress Cloud Tests') {
            steps {

                bat '''
                npx cypress run ^
                --record ^
                --key %CYPRESS_RECORD_KEY% ^
                --browser chrome
                '''
            }

            post {

                always {

                    archiveArtifacts(
                        artifacts: 'cypress/screenshots/**/*',
                        allowEmptyArchive: true
                    )

                    archiveArtifacts(
                        artifacts: 'cypress/videos/**/*',
                        allowEmptyArchive: true
                    )
                }

                failure {
                    echo 'Cypress detectó fallos. Revisa Cypress Cloud.'
                }
            }
        }

        // ─────────────────────────────────────────────
        // PUSH TO DOCKER HUB
        // ─────────────────────────────────────────────
        stage('Push to Docker Hub') {

            steps {

                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {

                    bat '''
                    docker login -u %DOCKER_USER% -p %DOCKER_PASS%

                    docker tag hobbies-app %DOCKER_USER%/hobbies-app:latest

                    docker push %DOCKER_USER%/hobbies-app:latest
                    '''
                }
            }
        }

        // ─────────────────────────────────────────────
        // DEPLOY CONTAINER
        // ─────────────────────────────────────────────
        stage('Deploy Container') {

            steps {

                // Detiene contenedor anterior
                bat 'docker stop hobbies-app 2>nul || exit 0'
                bat 'docker rm hobbies-app 2>nul || exit 0'

                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {

                    bat '''
                    docker pull %DOCKER_USER%/hobbies-app:latest

                    docker run -d ^
                    --name hobbies-app ^
                    -p 3000:3000 ^
                    %DOCKER_USER%/hobbies-app:latest
                    '''
                }
            }
        }
    }

    // ─────────────────────────────────────────────
    // CLEANUP
    // ─────────────────────────────────────────────
    post {

        always {

            // Limpia contenedor temporal Cypress
            bat 'docker stop hobbies-test 2>nul || exit 0'
            bat 'docker rm hobbies-test 2>nul || exit 0'
        }

        success {
            echo 'Pipeline completado correctamente.'
        }

        failure {
            echo 'Pipeline falló.'
        }
    }
}