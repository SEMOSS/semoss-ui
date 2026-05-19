import { Icon } from "@iconify/react";
import defaultFileData from "@iconify-icons/vscode-icons/default-file";
import audioData from "@iconify-icons/vscode-icons/file-type-audio";
import cData from "@iconify-icons/vscode-icons/file-type-c";
import cargoData from "@iconify-icons/vscode-icons/file-type-cargo";
import certData from "@iconify-icons/vscode-icons/file-type-cert";
import clojureData from "@iconify-icons/vscode-icons/file-type-clojure";
import clojureSData from "@iconify-icons/vscode-icons/file-type-clojurescript";
import cppData from "@iconify-icons/vscode-icons/file-type-cpp";
import csharpData from "@iconify-icons/vscode-icons/file-type-csharp";
import cssData from "@iconify-icons/vscode-icons/file-type-css";
import dartData from "@iconify-icons/vscode-icons/file-type-dartlang";
import diffData from "@iconify-icons/vscode-icons/file-type-diff";
import dockerData from "@iconify-icons/vscode-icons/file-type-docker";
import dotenvData from "@iconify-icons/vscode-icons/file-type-dotenv";
import elixirData from "@iconify-icons/vscode-icons/file-type-elixir";
import elmData from "@iconify-icons/vscode-icons/file-type-elm";
import erlangData from "@iconify-icons/vscode-icons/file-type-erlang";
import excelData from "@iconify-icons/vscode-icons/file-type-excel";
import fsharpData from "@iconify-icons/vscode-icons/file-type-fsharp";
import gitData from "@iconify-icons/vscode-icons/file-type-git";
import goData from "@iconify-icons/vscode-icons/file-type-go";
import graphqlData from "@iconify-icons/vscode-icons/file-type-graphql";
import groovyData from "@iconify-icons/vscode-icons/file-type-groovy";
import haskellData from "@iconify-icons/vscode-icons/file-type-haskell";
import htmlData from "@iconify-icons/vscode-icons/file-type-html";
import imageData from "@iconify-icons/vscode-icons/file-type-image";
import javaData from "@iconify-icons/vscode-icons/file-type-java";
import juliaData from "@iconify-icons/vscode-icons/file-type-julia";
import jupyterData from "@iconify-icons/vscode-icons/file-type-jupyter";
import keyData from "@iconify-icons/vscode-icons/file-type-key";
import kotlinData from "@iconify-icons/vscode-icons/file-type-kotlin";
import lessData from "@iconify-icons/vscode-icons/file-type-less";
import licenseData from "@iconify-icons/vscode-icons/file-type-license";
import configData from "@iconify-icons/vscode-icons/file-type-light-config";
import sqliteData from "@iconify-icons/vscode-icons/file-type-light-db";
import fontData from "@iconify-icons/vscode-icons/file-type-light-font";
import gradleData from "@iconify-icons/vscode-icons/file-type-light-gradle";
import jsData from "@iconify-icons/vscode-icons/file-type-light-js";
import jsonData from "@iconify-icons/vscode-icons/file-type-light-json";
import nimData from "@iconify-icons/vscode-icons/file-type-light-nim";
import rustData from "@iconify-icons/vscode-icons/file-type-light-rust";
import solidityData from "@iconify-icons/vscode-icons/file-type-light-solidity";
import stylusData from "@iconify-icons/vscode-icons/file-type-light-stylus";
import tomlData from "@iconify-icons/vscode-icons/file-type-light-toml";
import yamlData from "@iconify-icons/vscode-icons/file-type-light-yaml";
import logData from "@iconify-icons/vscode-icons/file-type-log";
import luaData from "@iconify-icons/vscode-icons/file-type-lua";
import makefileData from "@iconify-icons/vscode-icons/file-type-makefile";
import markdownData from "@iconify-icons/vscode-icons/file-type-markdown";
import mavenData from "@iconify-icons/vscode-icons/file-type-maven";
import npmData from "@iconify-icons/vscode-icons/file-type-npm";
import ocamlData from "@iconify-icons/vscode-icons/file-type-ocaml";
import pdfData from "@iconify-icons/vscode-icons/file-type-pdf2";
import perlData from "@iconify-icons/vscode-icons/file-type-perl";
import phpData from "@iconify-icons/vscode-icons/file-type-php";
import powerpointData from "@iconify-icons/vscode-icons/file-type-powerpoint";
import pythonData from "@iconify-icons/vscode-icons/file-type-python";
import rData from "@iconify-icons/vscode-icons/file-type-r";
import jsxData from "@iconify-icons/vscode-icons/file-type-reactjs";
import tsxData from "@iconify-icons/vscode-icons/file-type-reactts";
import rubyData from "@iconify-icons/vscode-icons/file-type-ruby";
import sassData from "@iconify-icons/vscode-icons/file-type-sass";
import scalaData from "@iconify-icons/vscode-icons/file-type-scala";
import scssData from "@iconify-icons/vscode-icons/file-type-scss";
import shellData from "@iconify-icons/vscode-icons/file-type-shell";
import sqlData from "@iconify-icons/vscode-icons/file-type-sql";
import swiftData from "@iconify-icons/vscode-icons/file-type-swift";
import textData from "@iconify-icons/vscode-icons/file-type-text";
import tsData from "@iconify-icons/vscode-icons/file-type-typescript";
import vbData from "@iconify-icons/vscode-icons/file-type-vb";
import videoData from "@iconify-icons/vscode-icons/file-type-video";
import wordData from "@iconify-icons/vscode-icons/file-type-word";
import xmlData from "@iconify-icons/vscode-icons/file-type-xml";
import zigData from "@iconify-icons/vscode-icons/file-type-zig";
import zipData from "@iconify-icons/vscode-icons/file-type-zip";
import type React from "react";

type IconProps = { className?: string };

// biome-ignore lint/suspicious/noExplicitAny: iconify icon data objects are typed internally
function vsIcon(data: any): React.FC<IconProps> {
	return ({ className }) => <Icon icon={data} className={className} />;
}

// ─── Language / framework icons ────────────────────────────────────────────
export const TypeScriptIcon = vsIcon(tsData);
export const TSXIcon = vsIcon(tsxData);
export const JavaScriptIcon = vsIcon(jsData);
export const JSXIcon = vsIcon(jsxData);
export const PythonIcon = vsIcon(pythonData);
export const JavaIcon = vsIcon(javaData);
export const KotlinIcon = vsIcon(kotlinData);
export const GoIcon = vsIcon(goData);
export const RustIcon = vsIcon(rustData);
export const CIcon = vsIcon(cData);
export const CppIcon = vsIcon(cppData);
export const CSharpIcon = vsIcon(csharpData);
export const SwiftIcon = vsIcon(swiftData);
export const RubyIcon = vsIcon(rubyData);
export const PHPIcon = vsIcon(phpData);
export const DartIcon = vsIcon(dartData);
export const ScalaIcon = vsIcon(scalaData);
export const GroovyIcon = vsIcon(groovyData);
export const ClojureIcon = vsIcon(clojureData);
export const ClojureScriptIcon = vsIcon(clojureSData);
export const HaskellIcon = vsIcon(haskellData);
export const ElmIcon = vsIcon(elmData);
export const OCamlIcon = vsIcon(ocamlData);
export const FSharpIcon = vsIcon(fsharpData);
export const ElixirIcon = vsIcon(elixirData);
export const ErlangIcon = vsIcon(erlangData);
export const LuaIcon = vsIcon(luaData);
export const RIcon = vsIcon(rData);
export const JuliaIcon = vsIcon(juliaData);
export const ZigIcon = vsIcon(zigData);
export const NimIcon = vsIcon(nimData);
export const SolidityIcon = vsIcon(solidityData);
export const VBIcon = vsIcon(vbData);
export const PerlIcon = vsIcon(perlData);

// ─── Web / markup / styling ────────────────────────────────────────────────
export const HTMLIcon = vsIcon(htmlData);
export const CSSIcon = vsIcon(cssData);
export const SCSSIcon = vsIcon(scssData);
export const SASSIcon = vsIcon(sassData);
export const LessIcon = vsIcon(lessData);
export const StylusIcon = vsIcon(stylusData);
export const GraphQLIcon = vsIcon(graphqlData);

// ─── Shell ─────────────────────────────────────────────────────────────────
export const ShellIcon = vsIcon(shellData);

// ─── Data / query ──────────────────────────────────────────────────────────
export const SQLIcon = vsIcon(sqlData);
export const SQLiteIcon = vsIcon(sqliteData);
export const JupyterIcon = vsIcon(jupyterData);

// ─── Config / settings ─────────────────────────────────────────────────────
export const YAMLIcon = vsIcon(yamlData);
export const TOMLIcon = vsIcon(tomlData);
export const JSONIcon = vsIcon(jsonData);
export const XMLIcon = vsIcon(xmlData);
export const EnvIcon = vsIcon(dotenvData);
export const GitIcon = vsIcon(gitData);
export const ConfigIcon = vsIcon(configData);

// ─── Prose / documents ─────────────────────────────────────────────────────
export const MarkdownIcon = vsIcon(markdownData);
export const TextIcon = vsIcon(textData);
export const DocIcon = vsIcon(wordData);
export const PDFIcon = vsIcon(pdfData);

// ─── Spreadsheets / presentations ──────────────────────────────────────────
export const SpreadsheetIcon = vsIcon(excelData);
export const PresentationIcon = vsIcon(powerpointData);

// ─── Media ─────────────────────────────────────────────────────────────────
export const ImageIcon = vsIcon(imageData);
export const AudioIcon = vsIcon(audioData);
export const VideoIcon = vsIcon(videoData);

// ─── Archives ──────────────────────────────────────────────────────────────
export const ArchiveIcon = vsIcon(zipData);

// ─── Security ──────────────────────────────────────────────────────────────
export const CertIcon = vsIcon(certData);
export const KeyIcon = vsIcon(keyData);

// ─── Misc ──────────────────────────────────────────────────────────────────
export const DiffIcon = vsIcon(diffData);
export const LogIcon = vsIcon(logData);
export const FontIcon = vsIcon(fontData);

// ─── Special file icons ────────────────────────────────────────────────────
export const DockerIcon = vsIcon(dockerData);
export const MavenIcon = vsIcon(mavenData);
export const GradleIcon = vsIcon(gradleData);
export const NPMIcon = vsIcon(npmData);
export const LicenseIcon = vsIcon(licenseData);
export const MakefileIcon = vsIcon(makefileData);
export const CargoIcon = vsIcon(cargoData);

// ─── Generic fallback (VS Code default-file icon) ─────────────────────────
export const GenericFileIcon = vsIcon(defaultFileData);

// ─── Exact filename → icon (checked before extension) ─────────────────────
export const BRAND_ICON_FILENAMES: Record<string, React.FC<IconProps>> = {
	dockerfile: DockerIcon,
	"docker-compose.yml": DockerIcon,
	"docker-compose.yaml": DockerIcon,
	"docker-compose.override.yml": DockerIcon,
	"pom.xml": MavenIcon,
	"build.gradle": GradleIcon,
	"build.gradle.kts": GradleIcon,
	"settings.gradle": GradleIcon,
	"settings.gradle.kts": GradleIcon,
	"package.json": NPMIcon,
	"package-lock.json": NPMIcon,
	"cargo.toml": CargoIcon,
	"cargo.lock": CargoIcon,
	"go.mod": GoIcon,
	"go.sum": GoIcon,
	"pyproject.toml": PythonIcon,
	"requirements.txt": PythonIcon,
	"setup.py": PythonIcon,
	"setup.cfg": PythonIcon,
	makefile: MakefileIcon,
	gnumakefile: MakefileIcon,
	license: LicenseIcon,
	"license.txt": LicenseIcon,
	"license.md": LicenseIcon,
	copying: LicenseIcon,
	"copying.txt": LicenseIcon,
};

// ─── Extension → icon map ──────────────────────────────────────────────────
export const BRAND_ICON_EXTENSIONS: Record<string, React.FC<IconProps>> = {
	// TypeScript
	ts: TypeScriptIcon,
	mts: TypeScriptIcon,
	cts: TypeScriptIcon,
	tsx: TSXIcon,
	// JavaScript
	js: JavaScriptIcon,
	mjs: JavaScriptIcon,
	cjs: JavaScriptIcon,
	jsx: JSXIcon,
	// Python
	py: PythonIcon,
	pyw: PythonIcon,
	pyi: PythonIcon,
	// JVM
	java: JavaIcon,
	kt: KotlinIcon,
	kts: KotlinIcon,
	scala: ScalaIcon,
	groovy: GroovyIcon,
	clj: ClojureIcon,
	cljs: ClojureScriptIcon,
	// Systems
	go: GoIcon,
	rs: RustIcon,
	c: CIcon,
	h: CIcon,
	cpp: CppIcon,
	hpp: CppIcon,
	cc: CppIcon,
	cxx: CppIcon,
	cs: CSharpIcon,
	swift: SwiftIcon,
	zig: ZigIcon,
	nim: NimIcon,
	d: CIcon,
	m: CIcon,
	mm: CppIcon,
	// Scripting
	rb: RubyIcon,
	php: PHPIcon,
	lua: LuaIcon,
	dart: DartIcon,
	r: RIcon,
	jl: JuliaIcon,
	pl: PerlIcon,
	pm: PerlIcon,
	vb: VBIcon,
	sol: SolidityIcon,
	// Functional
	hs: HaskellIcon,
	elm: ElmIcon,
	ml: OCamlIcon,
	mli: OCamlIcon,
	fs: FSharpIcon,
	fsx: FSharpIcon,
	ex: ElixirIcon,
	exs: ElixirIcon,
	erl: ErlangIcon,
	hrl: ErlangIcon,
	// Web markup
	html: HTMLIcon,
	htm: HTMLIcon,
	// Styling
	css: CSSIcon,
	scss: SCSSIcon,
	sass: SASSIcon,
	less: LessIcon,
	styl: StylusIcon,
	// Query / schema
	graphql: GraphQLIcon,
	gql: GraphQLIcon,
	sql: SQLIcon,
	sqlite: SQLiteIcon,
	sqlite3: SQLiteIcon,
	db: SQLiteIcon,
	// Shell
	sh: ShellIcon,
	bash: ShellIcon,
	zsh: ShellIcon,
	fish: ShellIcon,
	nu: ShellIcon,
	ps1: ShellIcon,
	pwsh: ShellIcon,
	bat: ShellIcon,
	cmd: ShellIcon,
	// JSON
	json: JSONIcon,
	jsonc: JSONIcon,
	json5: JSONIcon,
	geojson: JSONIcon,
	// Config / settings
	yaml: YAMLIcon,
	yml: YAMLIcon,
	toml: TOMLIcon,
	ini: ConfigIcon,
	cfg: ConfigIcon,
	conf: ConfigIcon,
	env: EnvIcon,
	properties: ConfigIcon,
	xml: XMLIcon,
	plist: XMLIcon,
	xsd: XMLIcon,
	xslt: XMLIcon,
	wsdl: XMLIcon,
	gitignore: GitIcon,
	gitattributes: GitIcon,
	gitmodules: GitIcon,
	dockerignore: DockerIcon,
	npmrc: NPMIcon,
	nvmrc: ConfigIcon,
	yarnrc: ConfigIcon,
	babelrc: ConfigIcon,
	eslintrc: ConfigIcon,
	prettierrc: ConfigIcon,
	stylelintrc: ConfigIcon,
	htaccess: ConfigIcon,
	browserslistrc: ConfigIcon,
	editorconfig: ConfigIcon,
	// Notebooks
	ipynb: JupyterIcon,
	// Prose / docs
	md: MarkdownIcon,
	mdx: MarkdownIcon,
	txt: TextIcon,
	rst: TextIcon,
	adoc: TextIcon,
	rtf: TextIcon,
	doc: DocIcon,
	docx: DocIcon,
	odt: DocIcon,
	pages: DocIcon,
	msg: TextIcon,
	tex: TextIcon,
	// PDF
	pdf: PDFIcon,
	// Spreadsheets
	xls: SpreadsheetIcon,
	xlsx: SpreadsheetIcon,
	ods: SpreadsheetIcon,
	numbers: SpreadsheetIcon,
	csv: SpreadsheetIcon,
	tsv: SpreadsheetIcon,
	// Presentations
	ppt: PresentationIcon,
	pptx: PresentationIcon,
	odp: PresentationIcon,
	// Images
	png: ImageIcon,
	jpg: ImageIcon,
	jpeg: ImageIcon,
	gif: ImageIcon,
	webp: ImageIcon,
	svg: ImageIcon,
	bmp: ImageIcon,
	ico: ImageIcon,
	tiff: ImageIcon,
	tif: ImageIcon,
	img: ImageIcon,
	psd: ImageIcon,
	ai: ImageIcon,
	avif: ImageIcon,
	heic: ImageIcon,
	heif: ImageIcon,
	// Audio
	mp3: AudioIcon,
	wav: AudioIcon,
	ogg: AudioIcon,
	flac: AudioIcon,
	aac: AudioIcon,
	m4a: AudioIcon,
	wma: AudioIcon,
	opus: AudioIcon,
	mid: AudioIcon,
	midi: AudioIcon,
	// Video
	mp4: VideoIcon,
	mov: VideoIcon,
	avi: VideoIcon,
	mkv: VideoIcon,
	webm: VideoIcon,
	m4v: VideoIcon,
	wmv: VideoIcon,
	flv: VideoIcon,
	ogv: VideoIcon,
	vob: VideoIcon,
	// Archives
	zip: ArchiveIcon,
	tar: ArchiveIcon,
	gz: ArchiveIcon,
	rar: ArchiveIcon,
	"7z": ArchiveIcon,
	bz2: ArchiveIcon,
	xz: ArchiveIcon,
	tgz: ArchiveIcon,
	dmg: ArchiveIcon,
	iso: ArchiveIcon,
	pkg: ArchiveIcon,
	deb: ArchiveIcon,
	rpm: ArchiveIcon,
	// Security
	pem: CertIcon,
	crt: CertIcon,
	cer: CertIcon,
	key: KeyIcon,
	p12: KeyIcon,
	pfx: KeyIcon,
	pub: CertIcon,
	asc: CertIcon,
	// Lock files
	lock: ConfigIcon,
	// Diffs
	diff: DiffIcon,
	patch: DiffIcon,
	// Logs
	log: LogIcon,
	// Fonts
	ttf: FontIcon,
	otf: FontIcon,
	woff: FontIcon,
	woff2: FontIcon,
	eot: FontIcon,
};
