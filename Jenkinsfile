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

        stage('Run Tests') {
            steps {
                bat 'npm run test'
            }
        }

        stage('Build Docker Image') {
            steps {
                withEnv(["DOCKER_BUILDKIT=0"]) {
                    bat 'docker build -t hobbies-app .'
                }
            }
        }

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

        stage('Deploy Container') {
            steps {
                bat 'docker stop hobbies || exit 0'
                bat 'docker rm hobbies || exit 0'
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    bat 'docker run -d --name hobbies -p 3000:3000 %DOCKER_USER%/hobbies-app:latest'
                }
            }
        }
    }
}