var data = {
	"commits" : [{ 
			"commitSha" : "abc",
			"login" : "user",
			"files" : [{
				"fileName" : "foo.java",
				"diff" : 100,
				"issues" : ["LooseCoupling"],
				}, {
				"fileName" : "bar.java",
                "diff" : 50,
				"issues" : [],
				}
			],
		}, {
			"commitSha" : "def",
			"login" : "user",
			"files" : [{
				"fileName" : "foo.java",
                "diff" : -5,
				"issues" : [],
			}, {
				"fileName" : "bar.java",
                "diff" : -25,
                "issues" : [],
			}, {
				"fileName" : "baz.java",
                "diff" : 150,
				"issues" : ["UselessParentheses", "LooseCoupling", "ControlStatementBraces"],
			}]
		}, {
			"commitSha" : "gef",
			"login" : "user",
			"files" : [{
				"fileName" : "foo.java",
                "diff" : 20,
				"issues" : [],
			}, {
				"fileName" : "bar.java",
                "diff" : 30,
				"issues" : [],
			}, {
				"fileName" : "baz.java",
                "diff" : -5,
				"issues" : [],
			}, {
				"fileName" : "bat.java",
                "diff" : 135,
				"issues" : [],
			}]
		}
	]
}