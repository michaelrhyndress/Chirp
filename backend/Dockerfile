FROM ubuntu:16.04

RUN apt-get update -y
RUN apt-get install -y software-properties-common
RUN add-apt-repository ppa:deadsnakes/ppa
RUN apt-get update

RUN apt-get install -y build-essential python3.6 python3.6-dev python3-pip python3.6-venv
RUN apt-get install -y git

# update pip
RUN python3.6 -m pip install pip --upgrade

RUN python3.6 -m pip install setuptools
RUN python3.6 -m pip install wheel

# We copy just the requirements.txt first to leverage Docker cache
COPY ./ /app/

WORKDIR /app

RUN python3.6 -m pip install -r requirements.txt

COPY . /app

ENTRYPOINT [ "python3.6" ]

EXPOSE 8000

CMD [ "app.py" ]