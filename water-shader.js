const vWaterSource = `#version 300 es
in vec3 a_position;
in vec2 a_texcoord;
in vec3 a_normal;

out highp vec4 v_clipSpace;
out highp vec2 v_texcoord;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

void main() {
    v_texcoord = a_texcoord;

    highp vec4 worldPos = u_modelMatrix * vec4(a_position, 1.0);

    v_clipSpace = u_projectionMatrix * u_viewMatrix * worldPos;
    gl_Position = v_clipSpace;
}
`;

const fWaterSource = `#version 300 es

in highp vec4 v_clipSpace;
in highp vec2 v_texcoord;

out highp vec4 v_out_color;

uniform highp vec2 u_scroll;
uniform sampler2D u_reflection;
uniform sampler2D u_dudv;
uniform sampler2D u_normalMap;

void main() {
    highp vec2 ndc = (v_clipSpace.xy / v_clipSpace.w) / 2.0 + 0.5;
    ndc.y = -ndc.y;

    lowp vec2 offset = (texture(u_dudv, v_texcoord / 1.0 + u_scroll * 0.01).xy) * 2.0 - 1.0;
    offset *= 0.02;

    highp vec4 out_color = texture(u_reflection, ndc + offset);
    out_color.g += 0.02;
    out_color.b += 0.03;
    v_out_color = out_color;
}
`;