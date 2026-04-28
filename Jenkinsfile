pipeline {
    agent any

    tools {
        nodejs 'NodeJS'   // si tienes configurado NodeJS en Jenkins
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
                    bat 'sonar-scanner'
                }
            }
        }
    }
}