FROM openjdk:17-slim
RUN apt-get update && apt-get install -y time && rm -rf /var/lib/apt/lists/*
WORKDIR /code
CMD bash -c "javac Main.java 2>&1 && if [ $? -eq 0 ]; then /usr/bin/time -f 'TIME:%e' timeout 25s java -Xmx256m Main < input.txt > output.txt 2>&1; echo 'EXIT_CODE:'$? >> output.txt; else echo 'Compilation failed' > output.txt; echo 'EXIT_CODE:1' >> output.txt; fi"