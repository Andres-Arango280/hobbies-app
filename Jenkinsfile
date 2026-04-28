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
                        bat 'sonar-scanner'
                    }
                }
            }
        }
    }
}