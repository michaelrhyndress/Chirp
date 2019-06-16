import requests

class AzureAD():
    def __init__(self, access_token):
        self.access_token = access_token

    def search_user(self, user):
        headers = {
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en',
            'Authorization': 'Bearer {}'.format(self.access_token),
            'x-ms-effective-locale': 'en.en-us',
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'x-ms-version': '1.2.39.1733',
            'X-Requested-With': 'XMLHttpRequest',
            'x-ms-client-request-id': '13e86161-2917-4472-aa23-f5a84b5e3038',
        }

        params = (
            ('searchText', user),
            ('top', '25'),
            ('nextLink', ''),
            ('orderByThumbnails', 'false'),
            ('maxThumbnailCount', '999'),
            ('filterValue', 'All'),
            ('state', 'All'),
            ('adminUnit', ''),
        )
        res = requests.get('https://main.iam.ad.ext.azure.com/api/Users', headers=headers, params=params, timeout=30)
        return res.json()

    def get_user(self, object_id):
        headers = {
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en',
            'Authorization': 'Bearer {}'.format(self.access_token),
            'x-ms-effective-locale': 'en.en-us',
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'x-ms-version': '1.2.39.1733',
            'X-Requested-With': 'XMLHttpRequest',
            'x-ms-client-request-id': '13e86161-2917-4472-aa23-f5a84b5e303d'
        }

        response = requests.get('https://main.iam.ad.ext.azure.com/api/UserDetails/{}'.format(object_id),
                                headers=headers, timeout=30)

        return response.json()

    def get_user_groups(self, object_id):

        headers = {
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en',
            'Authorization': 'Bearer {}'.format(self.access_token),
            'x-ms-effective-locale': 'en.en-us',
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'x-ms-version': '1.2.39.1733',
            'X-Requested-With': 'XMLHttpRequest',
            'x-ms-client-request-id': '13e86161-2917-4472-aa23-f5a84b5e3066',
        }

        params = (
            ('top', '999'),
            ('nextLink',
             'directoryObjects(\'b052b56f-1891-4a0a-8d45-46a2b1f8701c\')/memberOf?$skiptoken=X\'445370740900010000000000000000140000008FE9798E6076E845914CBBD3F67BCBDF01000000000000000000000000000017312E322E3834302E3131333535362E312E342E323333310200000000000182BBF9AAEBDC254483131A9718C7423E\'&%24top=999'),
        )

        response = requests.get(
            'https://main.iam.ad.ext.azure.com/api/directoryObjects/{}/memberOf'.format(object_id),
            headers=headers, params=params)

        return response.json()
