let screenWidth;
let screenHeight;

let meshes = {
    cube: {"position":[-1,1,-1,1,1,1,1,1,-1,1,1,1,-1,-1,1,1,-1,1,-1,1,1,-1,-1,-1,-1,-1,1,1,-1,-1,-1,-1,1,-1,-1,-1,1,1,-1,1,-1,1,1,-1,-1,-1,1,-1,1,-1,-1,-1,-1,-1,-1,1,1,-1,1,1,-1,1,-1,1,-1,1,1,1,1,1,1,-1],"texcoord":[0.875,0.5,0.625,0.75,0.625,0.5,0.625,0.75,0.375,1,0.375,0.75,0.625,0,0.375,0.25,0.375,0,0.375,0.5,0.125,0.75,0.125,0.5,0.625,0.5,0.375,0.75,0.375,0.5,0.625,0.25,0.375,0.5,0.375,0.25,0.875,0.75,0.625,1,0.625,0.25,0.375,0.75,0.625,0.75,0.625,0.5],"normal":[0,1,0,0,1,0,0,1,0,0,0,1,0,0,1,0,0,1,-1,0,0,-1,0,0,-1,0,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,0,1,-1,0,0,0,-1,0,1,0,0,0,0,-1],"indices":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,0,18,1,3,19,4,6,20,7,9,21,10,12,22,13,15,23,16]},
    plane: {"position":[-1,0,-1,1,0,1,-1,0,1,1,0,-1],"texcoord":[1,0,0,1,0,0,1,1],"normal":[0,-1,0,0,-1,0,0,-1,0,0,-1,0],"indices":[0,1,2,0,3,1]},
}

{ // Namespace hack

let gl;

function initGL() {
    let canvas = document.getElementById("frame");
    gl = canvas.getContext("webgl2");
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.1, 0.1, 0.1, 1.0);

    resizeCanvas();
}

function resizeCanvas() {
    let canvas = document.getElementById("frame");
    if (canvas === null) return;

    // Resize the canvas
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Change graphics parameters
    gl.canvas.width = canvas.width;
    gl.canvas.height = canvas.height;
    gl.viewport(0, 0, canvas.width, canvas.height);
    screenWidth = canvas.width;
    screenHeight = canvas.height;
}

window.onresize = function() {
    resizeCanvas();
}

function newModel(objectData, targetShader) {
    // Create VAO
    let vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Set up VAO using shader's attribs
    Object.values(targetShader.attribs).forEach(attrib => {
        // Set up the buffer
        let buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        let bufferData = new Float32Array(objectData[attrib.name]);
        gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);

        // Enable the vertex attrib
        gl.enableVertexAttribArray(attrib.location);

        // Figure out the size from the type
        let size = 3;
        switch (attrib.type) {
            case 35664: // vec2
                size = 2; break;
            case 35665: // vec3
                size = 3; break;
            case 35666: // vec4
                size = 4; break;
        }

        // vertexAttribPointer with the figured out data
        gl.vertexAttribPointer(attrib.location, size, gl.FLOAT, false, 0, 0);
    });

    // Finally, set up the index buffer
    let idxBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);
    let indices = new Uint16Array(objectData.indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return {
        vao: vao,
        vertices: objectData.indices.length,
    };
}

function newShader(vertexSource, fragmentSource) {
    // Create and compile vertex shader
    let vShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vShader, vertexSource);
    gl.compileShader(vShader);

    // Create and compile fragment shader
    let fShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fShader, fragmentSource);
    gl.compileShader(fShader);

    // Check compilation errors
    if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) throw "Vertex compile error: " + gl.getShaderInfoLog(vShader);
    if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) throw "Fragment compile error: " + gl.getShaderInfoLog(fShader);

    // Create and link program
    let program = gl.createProgram();
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    gl.validateProgram(program);

    // Get attrib info for the shader
    let attribs = {};
    let attribCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < attribCount; i++) {
        let attribInfo = gl.getActiveAttrib(program, i);
        let shaderAttribName = attribInfo.name;
        let localAttribName = shaderAttribName;
        if (localAttribName.startsWith("a_")) localAttribName = localAttribName.substring(2); // I start attribs with a_ as convention but don't want that here
        attribs[localAttribName] = {
            name: localAttribName,
            location: gl.getAttribLocation(program, shaderAttribName),
            type: attribInfo.type,
        };
    }

    // Get uniform info for the shader
    let uniforms = {};
    let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
        let uniformInfo = gl.getActiveUniform(program, i);
        let shaderUniformName = uniformInfo.name;
        let localUniformName = shaderUniformName;
        if (localUniformName.startsWith("u_")) localUniformName = localUniformName.substring(2); // See above
        uniforms[localUniformName] = {
            name: localUniformName,
            location: gl.getUniformLocation(program, shaderUniformName),
            type: uniformInfo.type,
        };
    }

    // Return all these details about the shader
    let shader = {};
    shader.program = program;
    shader.attribs = attribs;
    shader.uniforms = uniforms;
    return shader;
}

function newTexture(url) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([128, 128, 128, 255]);
    gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        width,
        height,
        border,
        srcFormat,
        srcType,
        pixel
    );

    let image = new Image();
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          level,
          internalFormat,
          srcFormat,
          srcType,
          image
        );
    
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    };
    image.crossOrigin = "anonymous"
    image.src = url;
    
    return texture;
}

function setShaderParam(uniform, value) {
    switch (uniform.type) {
        case 5124: // int
            gl.uniform1i(uniform.location, value);
            return;
        case 5126: // float
            gl.uniform1f(uniform.location, value);
            return;
        case 35665: // vec3
            gl.uniform3f(uniform.location, value[0], value[1], value[2]);
            return;
        case 35676: // mat4
            gl.uniformMatrix4fv(uniform.location, false, value);
            return;
        default:
            console.log("Unknown uniform type " + uniform.type + " for " + uniform.name);
    }
}

function prepareGraphics() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function startShader(shader) {
    gl.useProgram(shader.program);
}

function draw(model) {
    gl.bindVertexArray(model.vao);
    gl.drawElements(gl.TRIANGLES, model.vertices, gl.UNSIGNED_SHORT, 0);
}

function setTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
}

} // Namespace