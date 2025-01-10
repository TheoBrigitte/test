module.exports = {
  "customManagers": [
    {
      "customType": 'regex',
      "fileMatch": [
        ".*y[a]?ml$"
      ],
      "matchStrings": [
        "(?<depName>.*)@(?<currentValue>.*)"
      ],
      "datasourceTemplate": "github-tags",
    }
  ]
}
