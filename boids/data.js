var data = {
    "commits": [{
        "commitSha": "abc",
        "login": "user",
        "files": [{
            "fileName": "foo.java",
            "diff": 100,
            "coupling": {
                "bar.java": 3,
            },
            "issues": ["LooseCoupling", "UselessParentheses"],
        }, {
            "fileName": "bar.java",
            "diff": 50,
            "coupling": {
                "foo.java": 4,
            },
            "issues": [],
        }
        ],
    }, {
        "commitSha": "def",
        "login": "user",
        "files": [{
            "fileName": "foo.java",
            "diff": -5,
            "coupling": {
                "bar.java": 3,
            },
            "issues": ["UselessParentheses", "LooseCoupling", "ControlStatementBraces"],
        }, {
            "fileName": "bar.java",
            "diff": -25,
            "coupling": {
                "foo.java": 4,
            },
            "issues": ["UselessParentheses", "LooseCoupling", "ControlStatementBraces"],
        }, {
            "fileName": "baz.java",
            "diff": 150,
            "coupling": {
                "bat.java": 5,
            },
            "issues": [],
        }, {
            "fileName": "bat.java",
            "diff": 150,
            "coupling": {
                "baz.java": 5,
            },
            "issues": [],
        }]
    },
    ]
}