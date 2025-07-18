FROM gcc:12
WORKDIR /code
CMD bash -c "g++ main.cpp -o main && timeout 5s ./main < input.txt"