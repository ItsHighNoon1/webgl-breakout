const vBrickSource = `#version 300 es
in vec3 a_position;
in vec2 a_texcoord;
in vec3 a_normal;

out highp vec3 v_normal;
out highp vec3 v_toLight;
out highp vec2 v_screenpos;
out highp vec2 v_texcoord;
out highp float v_alpha;
out highp float v_brightness;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform vec3 u_lightPos;
uniform int u_paddleDepth;
uniform int u_brickDepth;

void main() {
    v_texcoord = a_texcoord;
    v_normal = a_normal;

    highp vec4 worldPos = u_modelMatrix * vec4(a_position * 0.5, 1.0);
    gl_Position = u_projectionMatrix * u_viewMatrix * worldPos;

    v_toLight = u_lightPos - worldPos.xyz;
    v_screenpos = gl_Position.xy / gl_Position.z;
    v_alpha = u_brickDepth <= u_paddleDepth ? 1.0 : pow(0.3, float(u_brickDepth - u_paddleDepth));
    v_brightness = u_brickDepth == u_paddleDepth ? 1.0 : 0.5;
}
`;

const fBrickSource = `#version 300 es

const highp mat4 screen_door_matrix = mat4(
    1.0 / 17.0,  9.0 / 17.0,  3.0 / 17.0, 11.0 / 17.0,
    13.0 / 17.0,  5.0 / 17.0, 15.0 / 17.0,  7.0 / 17.0,
    4.0 / 17.0, 12.0 / 17.0,  2.0 / 17.0, 10.0 / 17.0,
    16.0 / 17.0,  8.0 / 17.0, 14.0 / 17.0,  6.0 / 17.0
);

in highp vec3 v_normal;
in highp vec3 v_toLight;
in highp vec2 v_screenpos;
in highp vec2 v_texcoord;
in highp float v_alpha;
in highp float v_brightness;

out highp vec4 v_out_color;

uniform sampler2D u_texture;

void main() {
    // Texture
    highp vec4 out_color = texture(u_texture, v_texcoord);
    out_color.xyz *= v_brightness;
    out_color.a *= v_alpha;

    // Screen door transparency
    ivec2 screen_door_pos = ivec2(gl_FragCoord.xy) % 4;
    if (out_color.a < screen_door_matrix[screen_door_pos.x][screen_door_pos.y]) {
        discard;
    } else {
        out_color.a = 1.0;
    }

    // Lighting
    highp float nDotL = dot(normalize(v_normal), normalize(v_toLight));
    nDotL = clamp(nDotL, 0.1, 1.0);
    out_color.xyz *= nDotL;

    // Final color
    v_out_color = out_color;
}
`;