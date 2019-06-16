"""
Dow Digital Hackathon 2018
Team Chirp
Author: Bradley Chippi
GitHub Repo: https://github.com/BChip/chirp
Date: 10/24/2018
Purpose: Backend for Chirp Application
"""
import json
import os
import time
import requests
from dotenv import load_dotenv
from flask import Flask, abort, request, Response
from flask_cors import CORS
import adal
from azuread import AzureAD

load_dotenv()
app = Flask(__name__)

USERNAME = os.getenv("GITHUB_USERNAME")
PASSWORD = os.getenv("GITHUB_PASSWORD")

REPO_OWNER = os.getenv("REPO_OWNER")
REPO_NAME = os.getenv("REPO_NAME")

context = adal.AuthenticationContext("https://login.microsoftonline.com/{}"
                                     .format(os.getenv("TENANT")))
res = context.acquire_token_with_username_password(os.getenv("RESOURCE"),
                                                   os.getenv("FUSERNAME"),
                                                   os.getenv("PASSWORD"),
                                                   os.getenv("CLIENTID"))

azure_access_token = res.get('accessToken')
ad = AzureAD(azure_access_token)

session = requests.Session()
session.auth = (USERNAME, PASSWORD)


@app.route('/issue', methods=['POST', 'GET'])
def handle_issue():
    if request.method == 'GET':
        return get_github_issues()
    elif request.method == 'POST':
        data = request.form
        title = data['title']
        body = data['description']
        return make_github_issue(title, body)
    abort(405)


@app.route('/issue/<issue_id>', methods=['GET'])
def handle_issue_by_id(issue_id):
    if request.method == 'GET':
        return get_github_issue(issue_id)
    abort(405)


@app.route('/issue/comments/<issue_id>', methods=['POST', 'GET'])
def handle_issue_comments(issue_id):
    if request.method == 'GET':
        return get_github_issue_comments(issue_id)
    elif request.method == 'POST':
        data = request.form
        body = data['body']
        return create_issue_comment(issue_id, body)
    abort(405)


@app.route('/issue/comments/<issue_id>/<user_id>', methods=['GET'])
def handle_signing_in_out(issue_id, user_id):
    return sign_handler(issue_id, user_id)


def make_github_issue(title, body):
    url = 'https://api.github.com/repos/%s/%s/issues' % (REPO_OWNER, REPO_NAME)
    issue = {'title': title,
             'body': body}
    exists = issue_exists(title)
    if exists:
        abort(403)
    resp = session.post(url, json.dumps(issue))
    return Response(json.dumps(resp.json()), status=201, mimetype="application/json")


def get_github_issue(issue_id):
    url = 'https://api.github.com/repos/%s/%s/issues/%s' % (REPO_OWNER, REPO_NAME, issue_id)
    resp = session.get(url)
    return Response(json.dumps(resp.json()), status=200, mimetype="application/json")


def get_github_issues():
    url = 'https://api.github.com/repos/%s/%s/issues' % (REPO_OWNER, REPO_NAME)
    resp = session.get(url)
    return Response(json.dumps(resp.json()), status=200, mimetype="application/json")


def __get_github_issues():
    url = 'https://api.github.com/repos/%s/%s/issues' % (REPO_OWNER, REPO_NAME)
    resp = session.get(url)
    return resp.json()


def issue_exists(name):
    issues = __get_github_issues()
    for issue in issues:
        if issue['title'] == name:
            return True
    return False


def create_issue_comment(issue_id, body):
    url = 'https://api.github.com/repos/%s/%s/issues/%s/comments' % \
          (REPO_OWNER, REPO_NAME, issue_id)
    issue = {'body': "<!---" + body + "-->"}
    resp = session.post(url, json.dumps(issue))
    return Response(json.dumps(resp.json()), status=201, mimetype="application/json")


def update_issue_comment(comment_id, body):
    url = 'https://api.github.com/repos/%s/%s/issues/comments/%s' % \
          (REPO_OWNER, REPO_NAME, comment_id)
    issue = {'body': "<!---" + body + "-->"}
    resp = session.patch(url, json.dumps(issue))
    return Response(json.dumps(resp.json()), status=201, mimetype="application/json")


def get_dow_user_object(user_id):
    results = ad.search_user(user_id)
    for user in results.get("items"):
        if "@dow.com" in user.get("mail"):
            return user.get("objectId")
    return None


def get_user_info(object_id):
    info = ad.get_user(object_id)
    return info.get("city"), info.get("mail"), info.get("givenName"), \
           info.get("surname"), info.get("manager"), info.get("mailNickname"), info.get("imageUrl")


def new_sign_in(issue_id, user_id):
    object_id = get_dow_user_object(user_id)
    city, mail, first_name, last_name, manager_object_id, user_id, image_url = get_user_info(object_id)
    payload = {"user_id": user_id, "mail": mail, "first_name": first_name,
               "last_name": last_name, "city": city, "image_url": image_url, "signed_in": True,
               "signed_in_time": time.time(), "signed_out_time": ""}
    if manager_object_id:
        manager_city, manager_mail, manager_first_name, manager_last_name, \
        manager_manager_object_id, manager_user_id, manager_img_url = get_user_info(
            manager_object_id)
        payload = {"user_id": user_id, "mail": mail, "first_name": first_name,
                   "last_name": last_name, "city": city, "image_url": image_url,
                   "manager": {"manager_id": manager_user_id, "manager_city": manager_city,
                               "manager_mail": manager_mail,
                               "manager_first_name": manager_first_name,
                               "manager_last_name": manager_last_name,
                               "manager_image_url": manager_img_url}, "signed_in": True,
                   "signed_in_time": time.time(), "signed_out_time": ""}
    return create_issue_comment(issue_id, json.dumps(payload))


def sign_out(issue_id, user_id):
    comment = parse_comment_id(issue_id, user_id)
    comment_id = comment['id']
    comment_body = json.loads(comment['body'])
    comment_body['signed_in'] = False
    comment_body['signed_out_time'] = time.time()
    return update_issue_comment(comment_id, json.dumps(comment_body))


def sign_in(issue_id, user_id):
    comment = parse_comment_id(issue_id, user_id)
    comment_id = comment['id']
    comment_body = json.loads(comment['body'])
    comment_body['signed_in'] = True
    comment_body['signed_in_time'] = time.time()
    return update_issue_comment(comment_id, json.dumps(comment_body))


def sign_handler(issue_id, user_id):
    comment = parse_comment_id(issue_id, user_id)
    if comment:
        comment_body = json.loads(comment['body'])
        if comment_body['signed_in']:
            return sign_out(issue_id, user_id)
        return sign_in(issue_id, user_id)
    return new_sign_in(issue_id, user_id)


def parse_comment_id(issue_id, user_id):
    comments = __get_github_issue_comments(issue_id)
    for comment in comments:
        comment_body = json.loads(comment['body'])
        if user_id.upper() == comment_body["user_id"].upper():
            return comment
    return None


def __get_github_issue_comments(issue_id):
    url = 'https://api.github.com/repos/%s/%s/issues/%s/comments' % \
          (REPO_OWNER, REPO_NAME, issue_id)
    resp = session.get(url)
    comments = resp.json()
    for comment in comments:
        comment['body'] = comment['body'].replace("<!---", "").replace("-->", "")
    return comments


def get_github_issue_comments(issue_id):
    url = 'https://api.github.com/repos/%s/%s/issues/%s/comments' % \
          (REPO_OWNER, REPO_NAME, issue_id)
    resp = session.get(url)
    comments = resp.json()
    for comment in comments:
        comment['body'] = comment['body'].replace("<!---", "").replace("-->", "")
    return Response(json.dumps(comments), status=200, mimetype="application/json")


if __name__ == '__main__':
    CORS(app)
    app.url_map.strict_slashes = False
    app.run(host="0.0.0.0", port="8000")
