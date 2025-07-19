FROM gcc:12
RUN apt-get update && apt-get install -y time && rm -rf /var/lib/apt/lists/*
WORKDIR /code
CMD bash -c "ls -l && cat main.cpp && echo '---' && cat input.txt && g++ -O2 -std=c++17 main.cpp -o main 2>&1 && echo 'Compiled' && ./main < input.txt"