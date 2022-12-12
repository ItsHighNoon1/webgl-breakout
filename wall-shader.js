const vWallSource = `#version 300 es
in vec3 a_position;
in vec2 a_texcoord;
in vec3 a_normal;

out highp vec3 v_normal;
out highp vec3 v_toLight;
out highp vec2 v_texcoord;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform highp vec3 u_lightPos;

void main() {
    v_texcoord = a_texcoord;
    v_normal = (u_modelMatrix * vec4(a_normal, 0.0)).xyz;

    highp vec4 worldPos = u_modelMatrix * vec4(a_position, 1.0);
    v_toLight = u_lightPos - worldPos.xyz;

    gl_Position = u_projectionMatrix * u_viewMatrix * worldPos;
}
`;

const fWallSource = `#version 300 es

in highp vec3 v_normal;
in highp vec3 v_toLight;
in highp vec2 v_texcoord;

out highp vec4 v_out_color;

uniform sampler2D u_texture;

void main() {
    highp float nDotL = dot(normalize(v_normal), normalize(v_toLight));
    nDotL = clamp(nDotL, 0.2, 1.0);

    highp vec4 out_color = texture(u_texture, v_texcoord);
    out_color.xyz *= 0.2 * nDotL;
    v_out_color = out_color;
}
`;