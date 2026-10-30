export default function ContactForm() {
  return (
    <form
      className="cform"
      action="https://formtorch.com/f/d0w1ed3wlm"
      method="POST"
    >
      <div className="cform-row">
        <label>
          <span>Name</span>
          <input name="name" type="text" maxLength={100} autoComplete="name" />
        </label>
        <label>
          <span>Email</span>
          <input
            name="email"
            type="email"
            maxLength={200}
            autoComplete="email"
            required
          />
        </label>
      </div>
      <label>
        <span>Message</span>
        <textarea name="message" rows={4} maxLength={2000} />
      </label>
      <div className="cform-foot">
        <button className="btn pri" type="submit">
          Send message
        </button>
      </div>
    </form>
  );
}
