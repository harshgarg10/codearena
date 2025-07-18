FROM openjdk:17-slim
WORKDIR /code
CMD bash -c "javac Main.java && timeout 5s java Main < input.txt"