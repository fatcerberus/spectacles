/**
 *  Sphere Runtime for Cellscripts
 *  Copyright (c) 2015-2019, Fat Cerberus
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 *
 *  * Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 *  * Neither the name of miniSphere nor the names of its contributors may be
 *    used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 *  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 *  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 *  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 *  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 *  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 *  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 *  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 *  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
**/

import { from } from 'cell-runtime';

const ts = require('$/buildtime/typescript');

class CellCompilerHost
{
	directoryExists(directoryName)
	{
		return FS.directoryExists(directoryName);
	}

	fileExists(fileName)
	{
		return FS.fileExists(fileName);
	}

	getCanonicalFileName(pathName)
	{
		// TypeScript doesn't understand SphereFS paths and thinks they're relative.  this means it
		// sometimes gives us a SphereFS prefix by itself.  if that happens, we need to add a slash
		// to ensure it normalizes properly.
		if (pathName === '$' || pathName === '@' || pathName === '#')
			pathName += '/';

		return FS.fullPath(pathName);
	}

	getCurrentDirectory()
	{
		return "";
	}

	getDefaultLibFileName(options)
	{
		return "$/buildtime/typescript/lib.d.ts";
	}

	getNewLine()
	{
		return "\n";
	}

	getSourceFile(fileName, target)
	{
		const sourceText = FS.readFile(fileName);
		return ts.createSourceFile(fileName, sourceText, target);
	}

	readDirectory(directoryName, extensions, excludePaths, includePaths, depth)
	{
		return from(new DirectoryStream(directoryName, { recursive: true }))
			.where(it => !it.isDirectory)
			.where(it => extensions.includes(FS.extensionOf(it.fullPath)))
			.where(it => !FS.match(it.fullPath, excludePaths))
			.where(it => FS.match(it.fullPath, includePaths))
			.select(it => it.fullPath)
			.toArray();
	}

	readFile(fileName)
	{
		return FS.readFile(fileName);
	}

	useCaseSensitiveFileNames()
	{
		return true;
	}

	writeFile(fileName, content)
	{
		FS.createDirectory(FS.directoryOf(fileName));
		FS.writeFile(fileName, content);
	}
}

const tsTool = new Tool((outFileName, inFileNames) => {
	const compilerHost = new CellCompilerHost();

	const basePath = FS.directoryOf(inFileNames[0]);
	const configFile = ts.readConfigFile(inFileNames[0], FS.readFile);
	const jobInfo = ts.parseJsonConfigFileContent(configFile.config, compilerHost, basePath);
	jobInfo.options.incremental = true;
	jobInfo.options.noEmit = false;
	jobInfo.options.outDir = FS.directoryOf(outFileName);
	jobInfo.options.rootDir = '$/';
	jobInfo.options.tsBuildInfoFile = outFileName;

	const program = ts.createProgram(jobInfo.fileNames, jobInfo.options, compilerHost);
    program.emit();
    const diags = ts.getPreEmitDiagnostics(program);
    for (const diag of diags) {
		let message = ts.flattenDiagnosticMessageText(diag.messageText);
		if (diag.file !== undefined) {
			const fileName = FS.fullPath(diag.file.fileName);
			const { line } = diag.file.getLineAndCharacterOfPosition(diag.start);
			message = `[${fileName}:${line + 1}] ${message}`;
		}
		if (jobInfo.options.noEmitOnError)
			error(message);
		else
			warn(message);
    }
}, "compiling TypeScript");

export
function compile(fileName, outputDirName)
{
	const outputFileName = FS.fullPath('tsc.json', outputDirName);
	return tsTool.stage(outputFileName, files(fileName));
}
