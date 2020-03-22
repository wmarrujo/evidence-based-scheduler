module.exports = {
	"transform": {
		"^.+\\.(ts|js)$": "ts-jest"
	},
	"testRegex": "(/tests/.*|(\\.|/)(test|spec))\\.(js|ts)$",
	"moduleFileExtensions": ["ts", "js", "json"],
	"moduleDirectories": ["node_modules", "src"],
	"moduleNameMapper": {
		"@/(.*)": "<rootDir>/src/$1"
	}
}