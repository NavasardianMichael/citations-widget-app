const path = require("path");

function toPosix(filePath) {
  return path.normalize(filePath).split(path.sep).join("/");
}

function isCssInteropCacheFile(config, filename) {
  if (!config.cssInterop_outputDirectory || filename.endsWith(".css")) {
    return false;
  }

  const normalizedFile = toPosix(filename);
  if (normalizedFile.includes("react-native-css-interop/.cache/")) {
    return true;
  }

  return toPosix(path.dirname(normalizedFile)) === toPosix(config.cssInterop_outputDirectory);
}

async function transform(config, projectRoot, filename, data, options) {
  const innerTransform = config.cssInterop_transformerPath
    ? require(config.cssInterop_transformerPath).transform
    : require("metro-transform-worker").transform;

  if (!isCssInteropCacheFile(config, filename)) {
    return innerTransform(config, projectRoot, filename, data, options);
  }

  const fakeFile =
    'import { injectData } from "react-native-css-interop/dist/runtime/native/styles";injectData({});';
  const result = await innerTransform(
    config,
    projectRoot,
    filename,
    Buffer.from(fakeFile),
    options,
  );
  const output = result.output[0];
  const code = output.data.code.replace("({})", data.toString("utf-8"));

  return {
    ...result,
    output: [
      {
        ...output,
        data: {
          ...output.data,
          code,
        },
      },
    ],
  };
}

module.exports = { transform };
