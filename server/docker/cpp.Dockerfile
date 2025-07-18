FROM gcc:12
RUN apt-get update && apt-get install -y time && rm -rf /var/lib/apt/lists/*
WORKDIR /code
CMD bash -c "g++ -O2 -std=c++17 main.cpp -o main 2>&1 && if [ $? -eq 0 ]; then /usr/bin/time -f 'TIME:%e' timeout 25s ./main < input.txt > output.txt 2>&1; echo 'EXIT_CODE:'$? >> output.txt; else echo 'Compilation failed' > output.txt; echo 'EXIT_CODE:1' >> output.txt; fi"