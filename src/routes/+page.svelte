<script lang="ts">
	import {Button} from "$lib/components/ui/button"
	import {BookMarked, Coffee, Pickaxe} from "lucide-svelte"
	import * as Collapsible from "$lib/components/ui/collapsible"
</script>

<div class="flex flex-col h-screen">
	<main class="container">
		<div class="my-36 text-center">
			<h1 class="text-6xl font-bold">Evidence-Based Scheduler</h1>
			<h2 class="text-xl pt-4">Project Management | Task Scheduling</h2>
		</div>
		<div class="my-24 grid grid-cols-4 gap-6">
			<div class="flex flex-col grow gap-2">
				<Button href="/graph">Dependency Graph</Button>
				<p>How tasks are connected to other tasks</p>
			</div>
			<div class="flex flex-col grow gap-2">
				<Button href="/tasks">Tasks</Button>
				<p>Record your time & What should you do next</p>
			</div>
			<div class="flex flex-col grow gap-2">
				<Button href="/resources">Resources</Button>
				<p>People, External Teams, Schedules, Machines</p>
			</div>
			<div class="flex flex-col grow gap-2">
				<Button href="/prediction">Prediction</Button>
				<p>When you will finish</p>
			</div>
		</div>
		<div class="flex justify-center gap-6 my-24">
			<Button href="https://github.com/wmarrujo/evidence-based-scheduler"><BookMarked class="mr-2" />GitHub Repository</Button>
			<Button href="https://buymeacoffee.com/wmarrujo"><Coffee class="mr-2" />Buy me a coffee</Button>
			<Button href="https://wmarrujo.com/projects"><Pickaxe class="mr-2" />Other projects</Button>
		</div>
		<article id="about" class="prose dark:prose-invert">
			<h1>What even is this?</h1>
			<p>It&#39;s a project management / task scheduling program that knows that everyone sucks at estimating and still gives reliable predictions for when projects are going to be done. It is an implementation of the &quot;Evidence-Based Scheduling&quot; idea, which is proposed in <a href="https://www.joelonsoftware.com/2007/10/26/evidence-based-scheduling/">this blog post</a> by Joel Spoolsky.</p>
			<p>It is free &amp; open source</p>
			<p>It lets you</p>
			<ul>
				<li>see your task dependencies clearly</li>
				<li>manage resources</li>
				<li>record project progress</li>
				<li>come up with reliable predictions of when you&#39;ll be done</li>
			</ul>
			
			<h1>Core Ideas</h1>
			
			<h2>Evidence-Based</h2>
			<p>This type of scheduling is best understood if you read <a href="https://www.joelonsoftware.com/2007/10/26/evidence-based-scheduling/">this blog post</a>, but here&#39;s a quick summary:</p>
			
			<h3>Break down tasks</h3>
			<p>You&#39;re <em>sooo</em> bad at estimating anything that is too big. But you can more or less reliably estimate things that are small enough to accomplish in a couple of hours. So you have to break tasks down to this, down to about a maximum of 16 hours.</p>
			<p>Breaking things down forces you to <em>design</em> the features you want to build, which is what really adds the reliability to the schedule.</p>
			
			<h3>Keep the clock running</h3>
			<p>Ok, so we know you suck at estimating tasks, but the hope is that you&#39;re at least consistently bad. So, we record the estimate, then compare it with how long it actually took you to finish.</p>
			<p>What about interruptions or scheduled irrelevancies? It&#39;s simple: Keep the clock running. You&#39;re measuring the time from start to finish for the task. Everything else will be accounted for in the average over time.</p>
			
			<h3>Simulate the future</h3>
			<p>Now that we have the tasks, their estimates, and your estimation accuracy, we can extrapolate that into the future and tell you when the project will be done. The Monte Carlo method works fine for this and gives you a probability that the project will be done on any given date.</p>
			<p>If you take snapshots over time as the project goes on, you can even check how the project&#39;s predicted done date is changing. You want to see the done date prediction stay stable or even move backward in time, and you want the range of probable dates to converge on one date. With this you can know with confidence when your project will be done.</p>
			<p>Note that you should still put buffer into your timelines, because there are always unforseen tasks that pop up, this method just gives reliability for the project scope as it stands today.</p>
			
			<h2>Fractal Projects</h2>
			<p>Projects are made up of multiple tasks. Likewise, tasks themselves when broken up are just mini-projects, and projects can operate as tasks of larger super-projects. This kind of similarity at different scales is called a fractal. This app allows you to model arbitrary-level projects.</p>
			<p>Tasks may also often be a part of multiple projects. This app allows for that.</p>
			
			<h2>Version Control</h2>
			<p>Projects change often and usually by many people. A version control system is built for these kinds of changes. In particular, it provides a natural way to handle conflicts and syncing between many people managing their own stable copies. Distributed version control systems even allow this to happen without a centralized server.</p>
			<p>This app uses json as a storage mechanism for the data, so it is ready to be used with any version control system.</p>
			<p>A side-benefit of this is that you can also build your own tools to do whatever analysis and manipulation you like with the data.</p>
			
			<h1>Inspiration</h1>
			<ul>
				<li><a href="https://www.joelonsoftware.com/2007/10/26/evidence-based-scheduling/">Evidence Based Scheduling</a>, obviously</li>
				<li>the <a href="https://medium.com/@bre/the-cult-of-done-manifesto-724ca1c2ff13">Cult of Done</a></li>
				<li>&quot;No one ever died on a deadline&quot; - from <a href="https://www.blackswanltd.com/never-split-the-difference">Never Split the Difference</a> by Chris Voss</li>
			</ul>
			
			<h1>Frequently Asked Questions</h1>
			<ul>
				<li>
					<Collapsible.Root>
						<Collapsible.Trigger class="underline">How do I count time done fixing bugs from an already done task?</Collapsible.Trigger>
						<Collapsible.Content>Count it towards the original task, you&#39;re spending more time finishing that task to it&#39;s definition of done after all</Collapsible.Content>
					</Collapsible.Root>
				</li>
				<li>
					<Collapsible.Root>
						<Collapsible.Trigger class="underline">What do I do about tasks that might become unnecessary?</Collapsible.Trigger>
						<Collapsible.Content>Put it in as if you need to do it. when you discover that you don&#39;t need to do it, mark it as abandoned and you&#39;ll be happy that your completion date moves up</Collapsible.Content>
					</Collapsible.Root>
				</li>
				<li>
					<Collapsible.Root>
						<Collapsible.Trigger class="underline">What do I do about research-y or experimentation tasks?</Collapsible.Trigger>
						<Collapsible.Content>handle these like normal tasks, break them up into the specific things you will do to answer the questions you have. Add more tasks as your questions get better, build in buffer to whatever milestone in anticipation of there being more tasks than you know about now. See it as similar to feature creep.</Collapsible.Content>
					</Collapsible.Root>
				</li>
				<li>
					<Collapsible.Root>
						<Collapsible.Trigger class="underline">How do I transfer a task to another person?</Collapsible.Trigger>
						<Collapsible.Content>If you haven&#39;t started it yet, you can just change it, but remember to have them put in <em>their</em> estimate before they start. If you have started it already, make them a new task which is a copy of yours, and mark yours as abandoned.</Collapsible.Content>
					</Collapsible.Root>
				</li>
			</ul>
		</article>
	</main>
	<div class="flex justify-center gap-6 py-24">
		<Button href="https://github.com/wmarrujo/evidence-based-scheduler"><BookMarked class="mr-2" />GitHub Repository</Button>
		<Button href="https://buymeacoffee.com/wmarrujo"><Coffee class="mr-2" />Buy me a coffee</Button>
		<Button href="https://wmarrujo.com/projects"><Pickaxe class="mr-2" />Other projects</Button>
	</div>
</div>
