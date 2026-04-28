pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
    }

    stages {

        stage('Install Dependencies') {
            steps {
                bat 'npm install'
            }
        }

        stage('Run Tests with Coverage') {
            steps {
                bat 'npm run test'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    withEnv(["PATH+SONAR=C:\\sonar-scanner\\bin"]) {
                        withCredentials([string(credentialsId: 'sonarqube-token', variable: 'SONAR_TOKEN')]) {
                            bat 'sonar-scanner -Dsonar.token=%SONAR_TOKEN% -Dsonar.projectKey=hobbies-app -Dsonar.sources=. -Dsonar.exclusions=node_modules/**,tests/**'
                        }
                    }
                }
            }
        }
    }
}