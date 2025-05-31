"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var fast_levenshtein_1 = require("fast-levenshtein");
var compareTexts = function (referencePath, folderPath) {
    var referenceText = (0, node_fs_1.readFileSync)(referencePath, 'utf-8').trim();
    var files = (0, node_fs_1.readdirSync)(folderPath);
    var results = [];
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var file = files_1[_i];
        var fullPath = (0, node_path_1.join)(folderPath, file);
        if (fullPath === referencePath || !file.endsWith('.txt'))
            continue;
        var text = (0, node_fs_1.readFileSync)(fullPath, 'utf-8').trim();
        var distance = fast_levenshtein_1.default.get(referenceText, text);
        var maxLength = Math.max(referenceText.length, text.length);
        var similarity = maxLength === 0 ? 100 : (1 - distance / maxLength) * 100;
        results.push({
            file: file,
            distance: distance,
            similarity: +similarity.toFixed(2),
        });
    }
    return results;
};
var __dirname = new URL('.', import.meta.url).pathname;
var reference = (0, node_path_1.join)(__dirname, '../utils/texts/reference.txt');
var folder = (0, node_path_1.join)(__dirname, '../utils/texts');
var results = compareTexts(reference, folder);
console.log(results);
